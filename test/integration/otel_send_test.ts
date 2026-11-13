/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import { AddressInfo } from "net";
import { IncomingHttpHeaders, createServer } from "http";
import {
  Context, ContextManager, DiagLogLevel, ROOT_CONTEXT, Span, SpanKind, SpanStatusCode, TextMapPropagator, TraceFlags,
  context, defaultTextMapGetter, defaultTextMapSetter, diag, propagation, trace,
} from "@opentelemetry/api";
import { SeverityNumber, logs } from "@opentelemetry/api-logs";
import { W3CTraceContextPropagator, parseTraceParent } from "@opentelemetry/core";
import { InMemoryLogRecordExporter, LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import {
  InMemorySpanExporter, NodeTracerProvider, ReadableSpan, SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";

import { CloudEvent, EmitterFunction, HTTPTransportResponse, emitterFor, httpTransport } from "../../src";
import { TracingOptions, withTracing } from "../../src/otel";

export const exporter = new InMemorySpanExporter();
const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
const testTracer = provider.getTracer("test");
const propagator = new W3CTraceContextPropagator();

export const TRANSPORT_TRACE_ID = "1".repeat(32);
export const TRANSPORT_SPAN_ID = "1".repeat(16);
export const TRANSPORT_TRACEPARENT = `00-${TRANSPORT_TRACE_ID}-${TRANSPORT_SPAN_ID}-01`;
export const EVENT_TRACE_ID = "2".repeat(32);
export const EVENT_SPAN_ID = "2".repeat(16);
export const EVENT_TRACEPARENT = `00-${EVENT_TRACE_ID}-${EVENT_SPAN_ID}-01`;
const EVENT_TRACESTATE = "vendor=value";
const VALID_TRACEPARENT = /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/;

export const minimalOptions: TracingOptions = { system: "kafka" };

export const tracingOptions: TracingOptions = {
  system: "kafka",
  destination: "orders",
  messageId: (event) => `message-${event.id}`,
  serverAddress: "broker.example.com",
  serverPort: 9092,
};

export function event(extensions: Record<string, unknown> = {}): CloudEvent<{ orderId: number }> {
  return new CloudEvent({
    id: "order-1",
    source: "/orders",
    type: "com.example.order.created",
    subject: "orders/1",
    data: { orderId: 1 },
    ...extensions,
  });
}

export const logExporter = new InMemoryLogRecordExporter();
const loggerProvider = new LoggerProvider({ processors: [new SimpleLogRecordProcessor({ exporter: logExporter })] });

export function removeTracerProvider(): void {
  trace.disable();
  context.disable();
  propagation.disable();
  logs.disable();
}

// Register an SDK for the tests of the calling suite, and remove it after them
export function useTracerProvider(
  config: { propagator?: TextMapPropagator; contextManager?: ContextManager } = {},
): void {
  before(() => {
    provider.register(config);
    logs.setGlobalLoggerProvider(loggerProvider);
  });
  beforeEach(() => {
    exporter.reset();
    logExporter.reset();
  });
  after(removeTracerProvider);
}

// A propagator with a header of its own, to tell the configured propagators from W3C Trace Context
export const testPropagator: TextMapPropagator = {
  inject: (target, carrier, setter) => {
    const spanContext = trace.getSpanContext(target);
    if (spanContext) {
      setter.set(carrier, "X-Test-Trace", `${spanContext.traceId}-${spanContext.spanId}`);
    }
  },
  extract: (target, carrier, getter) => {
    const value = getter.get(carrier, "X-Test-Trace");
    if (typeof value !== "string") {
      return target;
    }
    const [traceId, spanId] = value.split("-");
    return trace.setSpanContext(target, { traceId, spanId, traceFlags: TraceFlags.SAMPLED, isRemote: true });
  },
  fields: () => ["X-Test-Trace"],
};

export function extractedContext(traceparent: string): Context {
  return propagator.extract(ROOT_CONTEXT, { traceparent }, defaultTextMapGetter);
}

function traceparentOfContext(parentContext: Context): string {
  const carrier: Record<string, string> = {};
  propagator.inject(parentContext, carrier, defaultTextMapSetter);
  return carrier.traceparent;
}

function idsIn(traceparent: unknown) {
  return parseTraceParent(String(traceparent));
}

export function inActiveSpan<T>(
  name: string, callback: (span: Span) => Promise<T>, parentContext = context.active(),
): Promise<T> {
  return testTracer.startActiveSpan(name, {}, parentContext, async (span) => {
    try {
      return await callback(span);
    } finally {
      span.end();
    }
  });
}

export function finishedSpan(kind: SpanKind): ReadableSpan | undefined {
  return exporter.getFinishedSpans().find((span) => span.kind === kind);
}

export function spanNamed(name: string): ReadableSpan | undefined {
  return exporter.getFinishedSpans().find((span) => span.name === name);
}

// Collect the messages logged to diag at the error level while a function runs
export async function diagErrors(run: () => Promise<unknown>): Promise<unknown[]> {
  const messages: unknown[] = [];
  const ignore = (): void => undefined;
  const logger = { error: (message: unknown) => messages.push(message), warn: ignore, info: ignore, debug: ignore };
  diag.setLogger({ ...logger, verbose: ignore }, DiagLogLevel.ERROR);
  try {
    await run();
  } finally {
    diag.disable();
  }
  return messages;
}

export async function errorFrom(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error("Expected the promise to reject");
}

// Send options of any shape, to check how the headers option is handled
type SendOptions = { headers?: unknown; [key: string]: unknown };

interface Sent {
  event?: CloudEvent<unknown>;
  options?: SendOptions;
}

// An emitter which records what it is given
function recordingEmitter(sent: Sent, result: unknown = "sent"): EmitterFunction<unknown, SendOptions> {
  return async (value, options) => {
    sent.event = value;
    sent.options = options;
    return result;
  };
}

describe("withTracing() without an OpenTelemetry SDK", () => {
  const cases: Array<[string, Record<string, string>]> = [
    ["no extension", {}],
    ["a valid trace context", { traceparent: EVENT_TRACEPARENT, tracestate: EVENT_TRACESTATE }],
    ["an invalid extension", { traceparent: "invalid", tracestate: "old=value" }],
  ];
  for (const [label, extensions] of cases) {
    it(`Sends an event with ${label} and the send options unchanged`, async () => {
      const original = event(extensions);
      const sendOptions = { headers: { "x-request-id": "request-1" } };
      const sent: Sent = {};

      expect(await withTracing(recordingEmitter(sent), tracingOptions)(original, sendOptions)).to.equal("sent");
      expect(sent.event).to.equal(original);
      expect(sent.options).to.equal(sendOptions);
    });
  }
});

describe("withTracing()", () => {
  useTracerProvider();

  it("Sets the context of a PRODUCER span on an event without one", async () => {
    const original = event();
    const sent: Sent = {};

    await inActiveSpan("request", () => withTracing(recordingEmitter(sent), tracingOptions)(original));

    const producer = finishedSpan(SpanKind.PRODUCER);
    const injected = idsIn(sent.event?.traceparent);
    expect(sent.event).not.to.equal(original);
    expect(injected?.traceId).to.equal(producer?.spanContext().traceId);
    expect(injected?.spanId).to.equal(producer?.spanContext().spanId);
    expect(producer?.parentSpanContext?.spanId).to.equal(spanNamed("request")?.spanContext().spanId);
    expect(producer?.name).to.equal("send orders");
    expect(producer?.attributes).to.deep.equal({
      "cloudevents.event_id": "order-1",
      "cloudevents.event_source": "/orders",
      "cloudevents.event_spec_version": "1.0",
      "cloudevents.event_subject": "orders/1",
      "cloudevents.event_type": "com.example.order.created",
      "messaging.destination.name": "orders",
      "messaging.message.id": "message-order-1",
      "messaging.operation.name": "send",
      "messaging.operation.type": "send",
      "messaging.system.name": "kafka",
      "server.address": "broker.example.com",
      "server.port": 9092,
    });
  });

  it("Sends the same traceparent in the header and the extension with httpTransport", async () => {
    let received: IncomingHttpHeaders | undefined;
    const server = createServer((request, response) => {
      received = request.headers;
      response.end();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const emit = withTracing(emitterFor(httpTransport(`http://127.0.0.1:${port}`)), tracingOptions);

    try {
      await emit(event(), { headers: { "x-request-id": "request-1" } });
    } finally {
      server.close();
    }

    expect(received?.["ce-traceparent"]).to.match(VALID_TRACEPARENT);
    expect(received?.traceparent).to.equal(received?.["ce-traceparent"]);
    expect(received?.["x-request-id"]).to.equal("request-1");
  });

  it("Keeps the result and send option types of the built-in HTTP emitter", () => {
    const emit = withTracing(emitterFor(httpTransport("https://events.example.com/orders", {
      responseHandler: async () => ({ accepted: true }),
    })), tracingOptions);
    const typed: (value: CloudEvent<unknown>) => Promise<HTTPTransportResponse<{ accepted: boolean }>> = emit;
    // @ts-expect-error the built-in HTTP emitter takes only headers and signal for each send
    const unsupported = () => emit(event(), { label: "not an HTTP option" });

    expect(typed).to.be.a("function");
    expect(unsupported).to.be.a("function");
  });

  const headerForms: Array<[string, unknown, (sent: unknown) => unknown, (traceparent: unknown) => unknown]> = [
    [
      "a plain object",
      { "x-request-id": "request-1", TraceParent: TRANSPORT_TRACEPARENT },
      (sent) => sent,
      (traceparent) => ({ "x-request-id": "request-1", traceparent }),
    ],
    [
      "a Headers object",
      new Headers({ "x-request-id": "request-1", traceparent: TRANSPORT_TRACEPARENT }),
      (sent) => sent instanceof Headers && [...sent.entries()],
      (traceparent) => [["traceparent", traceparent], ["x-request-id", "request-1"]],
    ],
    [
      "a Map",
      new Map([["x-request-id", "request-1"], ["traceparent", TRANSPORT_TRACEPARENT]]),
      (sent) => sent instanceof Headers && [...sent.entries()],
      (traceparent) => [["traceparent", traceparent], ["x-request-id", "request-1"]],
    ],
    [
      "an array of pairs",
      [["x-request-id", "request-1"], ["x-request-id", "request-2"], ["TRACEPARENT", TRANSPORT_TRACEPARENT]],
      (sent) => sent,
      (traceparent) => [["x-request-id", "request-1"], ["x-request-id", "request-2"], ["traceparent", traceparent]],
    ],
  ];
  for (const [label, headers, received, expected] of headerForms) {
    it(`Keeps the other send options and the form of the headers given as ${label}`, async () => {
      const sent: Sent = {};

      await withTracing(recordingEmitter(sent), tracingOptions)(event(), { headers, label: "kept" });

      expect(sent.options?.label).to.equal("kept");
      expect(received(sent.options?.headers)).to.deep.equal(expected(sent.event?.traceparent));
    });
  }

  it("Drops a tracestate from the caller when the span has none", async () => {
    const sent: Sent = {};

    await withTracing(recordingEmitter(sent), tracingOptions)(event(), { headers: { Tracestate: "stale=value" } });

    expect(sent.options?.headers).to.deep.equal({ traceparent: sent.event?.traceparent });
  });

  it("Passes the context of the send span when forwarding, without changing the extension", async () => {
    const original = event({ traceparent: EVENT_TRACEPARENT, tracestate: EVENT_TRACESTATE });
    const sent: Sent = {};

    await inActiveSpan("relay request", () => withTracing(recordingEmitter(sent), tracingOptions)(original));

    const send = finishedSpan(SpanKind.CLIENT);
    const hop = idsIn((sent.options?.headers as Record<string, string>).traceparent);
    expect(sent.event).to.equal(original);
    expect(sent.event?.traceparent).to.equal(EVENT_TRACEPARENT);
    expect(sent.event?.tracestate).to.equal(EVENT_TRACESTATE);
    expect(hop?.spanId).to.equal(send?.spanContext().spanId);
    expect(send?.links.map((link) => link.context.spanId)).to.deep.equal([EVENT_SPAN_ID]);
  });

  it("Puts the extension and a child span of the emitter in the same trace", async () => {
    let traced: CloudEvent<unknown> | undefined;
    let hopTraceparent: string | undefined;
    const emitter: EmitterFunction = async (value) => inActiveSpan("http client", async () => {
      traced = value;
      hopTraceparent = traceparentOfContext(context.active());
    });

    await withTracing(emitter, tracingOptions)(event());

    const injected = idsIn(traced?.traceparent);
    const hop = idsIn(hopTraceparent);
    expect(hop?.traceId).to.equal(injected?.traceId);
    expect(hop?.spanId).not.to.equal(injected?.spanId);
  });

  it("Links to the creation context even when it is the active parent", async () => {
    await inActiveSpan("create", async (creation) => {
      const creationTraceparent = traceparentOfContext(trace.setSpanContext(ROOT_CONTEXT, creation.spanContext()));
      await withTracing(recordingEmitter({}), tracingOptions)(event({ traceparent: creationTraceparent }));

      const send = finishedSpan(SpanKind.CLIENT);
      expect(send?.parentSpanContext?.spanId).to.equal(creation.spanContext().spanId);
      expect(send?.links.map((link) => link.context.spanId)).to.deep.equal([creation.spanContext().spanId]);
    });
  });

  const replaced: Array<[string, Record<string, string>]> = [
    ["an invalid creation context", { traceparent: "invalid", tracestate: "old=value" }],
    ["a tracestate without a traceparent", { tracestate: "orphan=value" }],
  ];
  for (const [label, extensions] of replaced) {
    it(`Replaces ${label} with the context of a PRODUCER span`, async () => {
      const sent: Sent = {};

      await withTracing(recordingEmitter(sent), tracingOptions)(event(extensions));

      expect(sent.event?.traceparent).to.include(finishedSpan(SpanKind.PRODUCER)?.spanContext().traceId);
      expect(sent.event?.tracestate).to.equal(undefined);
    });
  }

  it("Names the span after the operation alone without a destination", async () => {
    await withTracing(recordingEmitter({}), minimalOptions)(event());

    const producer = finishedSpan(SpanKind.PRODUCER);
    expect(producer?.name).to.equal("send");
    for (const name of ["messaging.destination.name", "messaging.message.id", "server.address", "server.port"]) {
      expect(producer?.attributes).not.to.have.property(name);
    }
  });

  it("Computes the message identifier for each event", async () => {
    const emit = withTracing(recordingEmitter({}), tracingOptions);

    await emit(event());
    await emit(event({ id: "order-2" }));

    const ids = exporter.getFinishedSpans().map((span) => span.attributes["messaging.message.id"]);
    expect(ids).to.deep.equal(["message-order-1", "message-order-2"]);
  });

  it("Records a send failure on the span, logs it as an exception event and rejects with it", async () => {
    const emit = withTracing(async () => {
      throw new TypeError("boom");
    }, tracingOptions);

    const error = await errorFrom(emit(event()));

    const producer = finishedSpan(SpanKind.PRODUCER);
    expect(error).to.be.instanceOf(TypeError);
    expect(producer?.status).to.deep.equal({ code: SpanStatusCode.ERROR, message: "boom" });
    expect(producer?.attributes["error.type"]).to.equal("TypeError");
    expect(producer?.events).to.have.length(0);
    const logged = logExporter.getFinishedLogRecords();
    expect(logged.map((record) => [record.eventName, record.severityNumber, record.severityText])).to.deep.equal([
      ["messaging.send.exception", SeverityNumber.WARN, "WARN"],
    ]);
    expect(logged[0].attributes).to.deep.include({ "exception.type": "TypeError", "exception.message": "boom" });
    expect(logged[0].spanContext?.spanId).to.equal(producer?.spanContext().spanId);
  });

  it("Sends without the message identifier and logs to diag when its function throws", async () => {
    const sent: Sent = {};
    const emit = withTracing(recordingEmitter(sent), {
      ...minimalOptions,
      messageId: () => {
        throw new TypeError("boom");
      },
    });

    const messages = await diagErrors(() => emit(event()));

    expect(sent.event?.id).to.equal("order-1");
    expect(finishedSpan(SpanKind.PRODUCER)?.attributes).not.to.have.property("messaging.message.id");
    expect(messages).to.deep.equal(["cloudevents: messageId() threw, so messaging.message.id is left out"]);
  });

  it("Requires an emitter and a messaging system", () => {
    expect(() => withTracing(undefined as unknown as EmitterFunction, minimalOptions))
      .to.throw(TypeError, "An EmitterFunction is required");
    expect(() => withTracing(recordingEmitter({}), {} as TracingOptions))
      .to.throw(TypeError, "options.system is required");
  });
});

describe("withTracing() with a configured propagator", () => {
  useTracerProvider({ propagator: testPropagator });

  it("Writes the headers with the configured propagator and the extension as W3C Trace Context", async () => {
    const sent: Sent = {};

    await withTracing(recordingEmitter(sent), tracingOptions)(event(), { headers: { "x-test-trace": "stale" } });

    const producer = finishedSpan(SpanKind.PRODUCER)?.spanContext();
    expect(sent.options?.headers).to.deep.equal({ "X-Test-Trace": `${producer?.traceId}-${producer?.spanId}` });
    expect(idsIn(sent.event?.traceparent)?.spanId).to.equal(producer?.spanId);
  });
});
