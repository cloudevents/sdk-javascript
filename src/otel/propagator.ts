/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import {
  Context, ROOT_CONTEXT, TextMapGetter, TextMapPropagator, TextMapSetter, defaultTextMapGetter, trace,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

const w3c = new W3CTraceContextPropagator();

/**
 * Propagate W3C trace context with a CloudEvents HTTP-header fallback.
 */
export class CloudEventPropagator implements TextMapPropagator {
  /**
   * Write W3C trace context into a mutable carrier.
   * @param {Context} context the trace context to inject
   * @param {object} carrier the destination carrier
   * @param {TextMapSetter} setter the carrier's field writer
   * @returns {void}
   */
  inject<T>(context: Context, carrier: T, setter: TextMapSetter<T>): void {
    w3c.inject(context, carrier, setter);
  }

  /**
   * Read W3C trace context, falling back to CloudEvents HTTP headers.
   * @param {Context} context the base context
   * @param {object} carrier the source carrier
   * @param {TextMapGetter} getter the carrier's field reader
   * @returns {Context} the extracted context, or the base context when both formats are absent or invalid
   */
  extract<T>(context: Context, carrier: T, getter: TextMapGetter<T>): Context {
    // Determine validity from the carrier, independently of the base context's span.
    let extracted = w3c.extract(ROOT_CONTEXT, carrier, getter);
    const primary = trace.getSpanContext(extracted);
    if (!primary || !trace.isSpanContextValid(primary)) {
      extracted = w3c.extract(ROOT_CONTEXT, {
        traceparent: getter.get(carrier, "ce-traceparent"),
        tracestate: getter.get(carrier, "ce-tracestate"),
      }, defaultTextMapGetter);
    }
    const spanContext = trace.getSpanContext(extracted);
    return spanContext && trace.isSpanContextValid(spanContext)
      ? trace.setSpanContext(context, spanContext)
      : context;
  }

  /**
   * List the W3C headers written by inject.
   * @returns {string[]} propagation field names
   */
  fields(): string[] {
    return w3c.fields();
  }
}
