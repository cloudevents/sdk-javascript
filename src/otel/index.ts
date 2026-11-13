/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import {
  Attributes,
  Context,
  INVALID_SPAN_CONTEXT,
  Link,
  SpanContext,
  SpanKind,
  SpanStatusCode,
  context,
  diag,
  trace,
} from "@opentelemetry/api";

// The package root loads the bindings in the order they depend on each other
import { Binding, CloudEvent, CloudEventV1, EmitterFunction, HTTP, Headers, Message } from "..";
import {
  ATTR_CLOUDEVENTS_EVENT_ID, ATTR_CLOUDEVENTS_EVENT_SOURCE, ATTR_CLOUDEVENTS_EVENT_SPEC_VERSION,
  ATTR_CLOUDEVENTS_EVENT_SUBJECT, ATTR_CLOUDEVENTS_EVENT_TYPE, ATTR_ERROR_TYPE, ATTR_MESSAGING_BATCH_MESSAGE_COUNT,
  ATTR_MESSAGING_DESTINATION_NAME, ATTR_MESSAGING_DESTINATION_TEMPLATE, ATTR_MESSAGING_MESSAGE_ID,
  ATTR_MESSAGING_OPERATION_NAME,
  ATTR_MESSAGING_OPERATION_TYPE, ATTR_MESSAGING_SYSTEM_NAME, ATTR_SERVER_ADDRESS, ATTR_SERVER_PORT, Operation,
  SCOPE_NAME,
} from "./constants";
import { describeFailure, isError, logException } from "./logs";
import { recordOperation } from "./metrics";
import {
  activeTraceContext, deliveredContext, eventSpanContext, spanContextOf, withPropagatedHeaders, withTraceContext,
} from "./propagation";

/** Messaging attributes for spans and metrics. */
export type TracingOptions = {
  /** The messaging system, recorded as `messaging.system.name`, e.g. `kafka` */
  system: string;
  /**
   * The queue or topic. A string is shorthand for `{ name, lowCardinality: true }` and must not
   * describe a temporary or anonymous destination. Use an object for other destinations.
   */
  destination?: string | {
    /** The destination name, recorded on spans as `messaging.destination.name` */
    name?: string;
    /**
     * A low-cardinality pattern, such as `orders.{tenant}`, recorded as `messaging.destination.template`
     * on spans and metrics and used in span names.
     */
    template?: string;
    /**
     * Whether the name has low cardinality. Enables its use in metrics and, unless temporary or
     * anonymous, span names. Defaults to false.
     */
    lowCardinality?: boolean;
    /** Exclude a temporary or anonymous destination's actual name from span names. */
    temporaryOrAnonymous?: boolean;
  };
  serverAddress?: string;
  serverPort?: number;
  /**
   * Return the messaging system's message identifier for `messaging.message.id`.
   * If the callback throws, log the error with `diag` and omit the attribute.
   */
  messageId?: (event: CloudEventV1<unknown>) => string | undefined;
};

/** Options for {@linkcode receiverWithTracing} */
export type ReceiverOptions = TracingOptions & {
  /** The binding which decodes a message, `HTTP` by default */
  binding?: Binding;
};

type Events<T> = CloudEventV1<T> | CloudEventV1<T>[];

interface SpanSpec {
  kind: SpanKind;
  attributes: Attributes;
  links: Link[];
  parentContext: Context;
  messages: number;
}

/**
 * Wrap an emitter with a send span, messaging metrics and exception logs.
 *
 * The span uses the active context as its parent. Events without a valid creation context receive
 * the PRODUCER span's context; existing contexts are preserved and linked from a CLIENT span.
 * Configured propagators inject the span context into send headers, replacing matching fields.
 * Wrap retrying emitters with this function to cover all attempts in one span.
 *
 * @param {EmitterFunction} emitter the emitter to send events with
 * @param {TracingOptions} options the messaging system and destination
 * @returns {EmitterFunction} the traced emitter, preserving its result and option types
 */
export function withTracing<TResult, TOptions>(
  emitter: EmitterFunction<TResult, TOptions>, options: TracingOptions,
): EmitterFunction<TResult, TOptions> {
  checkArguments(emitter, options, "An EmitterFunction is required");

  return async function emitWithTracing<T>(event: CloudEvent<T>, sendOptions?: TOptions): Promise<TResult> {
    const creation = eventSpanContext(event);
    const spec: SpanSpec = {
      kind: creation ? SpanKind.CLIENT : SpanKind.PRODUCER,
      attributes: eventAttributes(event, options),
      links: creation ? [{ context: creation }] : [],
      parentContext: context.active(),
      messages: 1,
    };

    return inSpan("send", options, spec, () => {
      const traced = creation ? event : withTraceContext(event, activeTraceContext());
      return emitter(traced, withPropagatedHeaders(sendOptions));
    });
  };
}

/**
 * Wrap a handler of decoded events with a CONSUMER span, messaging metrics and exception logs.
 * The handler receives a single event or a batch unchanged.
 *
 * The parent is the active span, falling back to transport headers, then to the creation context
 * for a single event. Each valid creation context is linked. For batches, shared attributes go on
 * the span and per-event attributes on links, including for events without a valid context.
 *
 * @param {Function} handler processes an event or a batch of events
 * @param {TracingOptions} options the messaging system and destination
 * @returns {Function} the traced handler, accepting events and optional transport headers
 */
export function handlerWithTracing<T, R>(
  handler: (events: Events<T>) => Promise<R>, options: TracingOptions,
): (events: Events<T>, headers?: Headers) => Promise<R> {
  checkArguments(handler, options, "A handler function is required");

  return async (events, headers) => {
    const spec = Array.isArray(events) ? batchSpec(events, headers, options) : eventSpec(events, headers, options);
    return inSpan("process", options, spec, () => handler(events));
  };
}

/**
 * Decode a {@linkcode Message} and pass its events and headers to {@linkcode handlerWithTracing}.
 * Decoding failures reject without creating a span.
 *
 * @param {Function} handler processes an event or a batch of events
 * @param {ReceiverOptions} options the messaging system, destination and binding
 * @returns {Function} a receiver that decodes messages and traces the handler
 */
export function receiverWithTracing<T, R>(
  handler: (events: Events<T>) => Promise<R>, options: ReceiverOptions,
): (message: Message) => Promise<R> {
  const { binding = HTTP, ...tracing } = options ?? {};
  const handle = handlerWithTracing(handler, tracing as TracingOptions);
  return async (message) => handle(binding.toEvent<T>(message), message.headers);
}

function checkArguments(fn: unknown, options: TracingOptions, message: string): void {
  if (typeof fn !== "function") {
    throw new TypeError(message);
  }
  if (typeof options?.system !== "string" || options.system === "") {
    throw new TypeError("options.system is required");
  }
}

function eventSpec<T>(event: CloudEventV1<T>, headers: Headers | undefined, options: TracingOptions): SpanSpec {
  const creation = eventSpanContext(event);
  return {
    kind: SpanKind.CONSUMER,
    attributes: eventAttributes(event, options),
    links: creation ? [{ context: creation }] : [],
    // Only a single message may use its creation context as the parent
    parentContext: processParent(headers, creation),
    messages: 1,
  };
}

// Shared attributes belong on the span; per-event attributes belong on links.
function batchSpec<T>(events: CloudEventV1<T>[], headers: Headers | undefined, options: TracingOptions): SpanSpec {
  const perEvent = events.map((event) => ({
    creation: eventSpanContext(event),
    attributes: eventAttributes(event, options),
  }));
  const shared = sharedAttributes(perEvent.map(({ attributes }) => attributes));
  const withCreation: Link[] = [];
  const withoutCreation: Link[] = [];

  for (const { creation, attributes } of perEvent) {
    const own: Attributes = {};
    for (const [name, value] of Object.entries(attributes)) {
      if (!(name in shared)) {
        own[name] = value;
      }
    }
    if (creation) {
      withCreation.push({ context: creation, attributes: own });
    } else if (Object.keys(own).length > 0) {
      // A link without a valid context is still recorded when it has attributes
      withoutCreation.push({ context: INVALID_SPAN_CONTEXT, attributes: own });
    }
  }

  return {
    kind: SpanKind.CONSUMER,
    attributes: { ...shared, [ATTR_MESSAGING_BATCH_MESSAGE_COUNT]: events.length },
    // The SDK drops the oldest links over its limit, so the creation contexts go last
    links: [...withoutCreation, ...withCreation],
    parentContext: processParent(headers, undefined),
    messages: events.length,
  };
}

function processParent(headers: Headers | undefined, creation: SpanContext | undefined): Context {
  const active = context.active();
  if (spanContextOf(active)) {
    return active;
  }
  const delivered = deliveredContext(active, headers);
  if (spanContextOf(delivered) || !creation) {
    return delivered;
  }
  return trace.setSpanContext(delivered, creation);
}

function sharedAttributes(perEvent: Attributes[]): Attributes {
  const shared: Attributes = {};
  if (perEvent.length === 0) {
    return shared;
  }
  for (const [name, value] of Object.entries(perEvent[0])) {
    if (perEvent.every((attributes) => attributes[name] === value)) {
      shared[name] = value;
    }
  }
  return shared;
}

function inSpan<T>(operation: Operation, options: TracingOptions, spec: SpanSpec, run: () => Promise<T>): Promise<T> {
  const destination = destinationAttributes(options.destination);
  const name = destination.spanName ? `${operation} ${destination.spanName}` : operation;
  const common = operationAttributes(operation, options);
  const attributes: Attributes = {
    ...spec.attributes, ...common, ...destination.span, [ATTR_MESSAGING_OPERATION_TYPE]: operation,
  };
  const measured: Attributes = { ...common, ...destination.metrics };

  // A proxy tracer stays bound to the provider it first found
  const tracer = trace.getTracer(SCOPE_NAME);
  // Measured from before the span starts, as its start time is taken before span processors run
  const start = performance.now();
  return tracer.startActiveSpan(name, { kind: spec.kind, attributes, links: spec.links }, spec.parentContext,
    async (span) => {
      // Not context.active(), which some context managers do not keep across await
      const spanContext = trace.setSpan(spec.parentContext, span);
      let failure: string | undefined;
      try {
        return await run();
      } catch (err) {
        failure = errorType(err);
        span.setAttribute(ATTR_ERROR_TYPE, failure);
        span.setStatus({ code: SpanStatusCode.ERROR, message: describeFailure(err) });
        logException(operation, err, spanContext);
        throw err;
      } finally {
        const seconds = (performance.now() - start) / 1000;
        span.end();
        // After the span, so its duration does not include recording the metrics
        const recorded = failure ? { ...measured, [ATTR_ERROR_TYPE]: failure } : measured;
        recordOperation(operation, spec.messages, seconds, recorded);
      }
    });
}

function operationAttributes(operation: Operation, options: TracingOptions): Attributes {
  const attributes: Attributes = {
    [ATTR_MESSAGING_SYSTEM_NAME]: options.system,
    [ATTR_MESSAGING_OPERATION_NAME]: operation,
  };
  if (options.serverAddress) {
    attributes[ATTR_SERVER_ADDRESS] = options.serverAddress;
  }
  if (options.serverPort !== undefined) {
    attributes[ATTR_SERVER_PORT] = options.serverPort;
  }
  return attributes;
}

type DestinationOptions = Exclude<TracingOptions["destination"], string | undefined>;

interface DestinationAttributes {
  spanName?: string;
  span: Attributes;
  metrics: Attributes;
}

function destinationAttributes(destination: TracingOptions["destination"]): DestinationAttributes {
  const described: DestinationOptions = typeof destination === "string"
    ? { name: destination, lowCardinality: true }
    : destination ?? {};
  const { name, template, lowCardinality = false, temporaryOrAnonymous = false } = described;
  const span: Attributes = {};
  const metrics: Attributes = {};
  if (name) {
    span[ATTR_MESSAGING_DESTINATION_NAME] = name;
    if (lowCardinality) {
      metrics[ATTR_MESSAGING_DESTINATION_NAME] = name;
    }
  }
  if (template) {
    span[ATTR_MESSAGING_DESTINATION_TEMPLATE] = template;
    metrics[ATTR_MESSAGING_DESTINATION_TEMPLATE] = template;
  }
  const namesSpans = name && lowCardinality && !temporaryOrAnonymous ? name : undefined;
  return { spanName: template || namesSpans, span, metrics };
}

function errorType(err: unknown): string {
  try {
    if (isError(err)) {
      return err.constructor?.name || err.name || "_OTHER";
    }
  } catch {
    // An exception's properties can throw too
  }
  return "_OTHER";
}

function eventAttributes(event: CloudEventV1<unknown>, options: TracingOptions): Attributes {
  const attributes: Attributes = {
    [ATTR_CLOUDEVENTS_EVENT_ID]: event.id,
    [ATTR_CLOUDEVENTS_EVENT_SOURCE]: event.source,
    [ATTR_CLOUDEVENTS_EVENT_SPEC_VERSION]: event.specversion,
    [ATTR_CLOUDEVENTS_EVENT_TYPE]: event.type,
  };
  if (event.subject) {
    attributes[ATTR_CLOUDEVENTS_EVENT_SUBJECT] = event.subject;
  }
  try {
    const messageId = options.messageId?.(event);
    if (messageId) {
      attributes[ATTR_MESSAGING_MESSAGE_ID] = messageId;
    }
  } catch (error) {
    // A failing instrumentation callback must not stop the send or the handler
    diag.error("cloudevents: messageId() threw, so messaging.message.id is left out", error);
  }
  return attributes;
}
