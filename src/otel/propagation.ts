/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import {
  Context,
  ROOT_CONTEXT,
  SpanContext,
  TextMapGetter,
  context,
  defaultTextMapSetter,
  isSpanContextValid,
  propagation,
  trace,
} from "@opentelemetry/api";
import { TRACE_PARENT_HEADER, TRACE_STATE_HEADER, W3CTraceContextPropagator } from "@opentelemetry/core";

// The package root loads the bindings in the order they depend on each other
import { CloudEvent, CloudEventV1, Headers } from "..";

// CloudEvents extensions use W3C Trace Context independently of the configured transport propagators.
const propagator = new W3CTraceContextPropagator();

const headerGetter: TextMapGetter<Headers> = {
  get: (headers, key) => {
    const name = Object.keys(headers)
      .find((candidate) => candidate.toLowerCase() === key.toLowerCase() && headers[candidate] !== undefined);
    return name === undefined ? undefined : headers[name];
  },
  keys: (headers) => Object.keys(headers),
};

export function eventSpanContext(event: CloudEventV1<unknown>): SpanContext | undefined {
  const traceparent = event[TRACE_PARENT_HEADER];
  if (typeof traceparent !== "string") {
    return undefined;
  }
  const extension: Headers = {
    [TRACE_PARENT_HEADER]: traceparent,
    [TRACE_STATE_HEADER]: event[TRACE_STATE_HEADER] as string | undefined,
  };
  return spanContextOf(propagator.extract(ROOT_CONTEXT, extension, headerGetter));
}

export function deliveredContext(base: Context, headers: Headers | undefined): Context {
  return headers ? propagation.extract(base, headers, headerGetter) : base;
}

export function spanContextOf(source: Context): SpanContext | undefined {
  const spanContext = trace.getSpanContext(source);
  return spanContext && isSpanContextValid(spanContext) ? spanContext : undefined;
}

export function activeTraceContext(): Record<string, string> {
  const carrier: Record<string, string> = {};
  propagator.inject(context.active(), carrier, defaultTextMapSetter);
  return carrier;
}

export function withPropagatedHeaders<O>(options: O | undefined): O | undefined {
  const propagated: Record<string, string> = {};
  propagation.inject(context.active(), propagated, defaultTextMapSetter);
  if (Object.keys(propagated).length === 0) {
    return options;
  }
  const fields = [...propagation.fields(), ...Object.keys(propagated)].map((name) => name.toLowerCase());
  const base = (options ?? {}) as Record<string, unknown>;
  return { ...base, headers: replaceHeaders(base.headers, fields, propagated) } as unknown as O;
}

// Remove stale propagation fields even when their casing differs.
function replaceHeaders(headers: unknown, fields: string[], propagated: Record<string, string>): unknown {
  const kept = (name: string): boolean => !fields.includes(name.toLowerCase());
  if (Array.isArray(headers)) {
    return [...(headers as Array<[string, unknown]>).filter(([name]) => kept(name)), ...Object.entries(propagated)];
  }
  // Fetch Headers of any implementation, a Map or another iterable of pairs
  if (headers && typeof (headers as Iterable<unknown>)[Symbol.iterator] === "function") {
    if (typeof globalThis.Headers !== "function") {
      return replaceHeaders([...(headers as Iterable<[string, unknown]>)], fields, propagated);
    }
    const copy = new globalThis.Headers(headers as HeadersInit);
    fields.forEach((name) => copy.delete(name));
    Object.entries(propagated).forEach(([name, value]) => copy.set(name, value));
    return copy;
  }
  const result: Record<string, unknown> = {};
  if (headers && typeof headers === "object") {
    for (const [name, value] of Object.entries(headers)) {
      if (kept(name)) {
        result[name] = value;
      }
    }
  }
  return { ...result, ...propagated };
}

export function withTraceContext<T>(event: CloudEvent<T>, headers: Record<string, string>): CloudEvent<T> {
  if (!headers[TRACE_PARENT_HEADER]) {
    return event;
  }
  // cloneWith() merges attributes and would keep a stale tracestate as an undefined attribute
  const properties: Partial<CloudEventV1<T>> = { ...event };
  delete properties[TRACE_PARENT_HEADER];
  delete properties[TRACE_STATE_HEADER];
  properties[TRACE_PARENT_HEADER] = headers[TRACE_PARENT_HEADER];
  if (headers[TRACE_STATE_HEADER]) {
    properties[TRACE_STATE_HEADER] = headers[TRACE_STATE_HEADER];
  }
  // Skip validation, as the event may have been created without it
  return new CloudEvent<T>(properties, false);
}
