/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Context, TextMapGetter, defaultTextMapSetter } from "@opentelemetry/api";
import { CloudEventPropagator } from "./propagator";

// The package root loads the bindings in the order they depend on each other.
import { CloudEvent, CloudEventV1 } from "..";

const propagator = new CloudEventPropagator();
const getter: TextMapGetter<CloudEventV1<unknown>> = {
  get: (event, key) => typeof event[key] === "string" ? event[key] as string : undefined,
  keys: (event) => Object.keys(event),
};

/**
 * Copy a valid span context into a new CloudEvent, replacing its tracing extension.
 * @param {Context} context the trace context to inject
 * @param {CloudEvent} event the event to copy
 * @returns {CloudEvent} an event copy for a valid span context, otherwise the original event
 */
export function injectDistributedTracingExtension<T>(context: Context, event: CloudEvent<T>): CloudEvent<T> {
  const extension: Record<string, string> = {};
  propagator.inject(context, extension, defaultTextMapSetter);
  if (!extension.traceparent) {
    return event;
  }

  // cloneWith() merges properties, so remove the previous tracestate before copying the extension.
  const properties: Partial<CloudEventV1<T>> = { ...event };
  delete properties.traceparent;
  delete properties.tracestate;
  Object.assign(properties, extension);
  // Preserve events that were constructed without validation.
  return new CloudEvent<T>(properties, false);
}

/**
 * Extract the event's trace context while preserving other values from the supplied context.
 * @param {Context} context the base context
 * @param {CloudEventV1} event the event to read
 * @returns {Context} the combined context, or the supplied context for a missing or invalid extension
 */
export function extractDistributedTracingExtension(context: Context, event: CloudEventV1<unknown>): Context {
  return propagator.extract(context, event, getter);
}
