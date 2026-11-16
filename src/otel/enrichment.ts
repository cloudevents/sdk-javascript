/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Attributes, INVALID_SPAN_CONTEXT, Link, ROOT_CONTEXT, SpanContext, trace } from "@opentelemetry/api";
import { CloudEventV1 } from "..";
import { extractDistributedTracingExtension } from "./propagation";

/**
 * Prepare CloudEvents attributes and links for an event or batch.
 * For batches, common attributes belong on the span and per-event attributes on links.
 * @param {CloudEventV1 | CloudEventV1[]} events a decoded event or batch
 * @returns {object} span attributes and event links
 */
export function getCloudEventSpanOptions<T>(events: CloudEventV1<T> | CloudEventV1<T>[]): {
  attributes: Attributes; links: Link[];
} {
  if (Array.isArray(events)) {
    return batchSpanOptions(events.map((event) => ({
      creation: eventSpanContext(event), attributes: cloudEventAttributes(event),
    })));
  }
  const creation = eventSpanContext(events);
  return { attributes: cloudEventAttributes(events), links: creation ? [{ context: creation }] : [] };
}

export function eventSpanContext(event: CloudEventV1<unknown>): SpanContext | undefined {
  return trace.getSpanContext(extractDistributedTracingExtension(ROOT_CONTEXT, event));
}

export function cloudEventAttributes(event: CloudEventV1<unknown>): Attributes {
  const attributes: Attributes = {
    "cloudevents.event_id": event.id,
    "cloudevents.event_source": event.source,
    "cloudevents.event_spec_version": event.specversion,
    "cloudevents.event_type": event.type,
  };
  if (event.subject) {
    attributes["cloudevents.event_subject"] = event.subject;
  }
  return attributes;
}

export function batchSpanOptions(events: Array<{ creation?: SpanContext; attributes: Attributes }>): {
  attributes: Attributes; links: Link[];
} {
  const shared: Attributes = {};
  if (events.length > 0) {
    for (const [name, value] of Object.entries(events[0].attributes)) {
      if (events.every(({ attributes }) => attributes[name] === value)) {
        shared[name] = value;
      }
    }
  }

  const withCreation: Link[] = [];
  const withoutCreation: Link[] = [];
  for (const { creation, attributes } of events) {
    const own: Attributes = {};
    for (const [name, value] of Object.entries(attributes)) {
      if (!(name in shared)) {
        own[name] = value;
      }
    }
    if (creation) {
      withCreation.push({ context: creation, attributes: own });
    } else if (Object.keys(own).length > 0) {
      // A link without a valid context can still carry per-event attributes.
      withoutCreation.push({ context: INVALID_SPAN_CONTEXT, attributes: own });
    }
  }

  // JS tracing SDKs drop the oldest links over their limit; keep creation contexts last.
  return { attributes: shared, links: [...withoutCreation, ...withCreation] };
}
