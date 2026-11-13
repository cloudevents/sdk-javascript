/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Attributes, Counter, Histogram, MeterProvider, metrics } from "@opentelemetry/api";

import { ATTR_MESSAGING_OPERATION_TYPE, DURATION_BUCKETS, Operation, SCOPE_NAME } from "./constants";

interface Instruments {
  operationDuration: Histogram;
  sentMessages: Counter;
  consumedMessages: Counter;
  processDuration: Histogram;
}

// Cache per provider so an SDK registered after import is picked up.
const instrumentsByProvider = new WeakMap<MeterProvider, Instruments>();

function instruments(): Instruments {
  const provider = metrics.getMeterProvider();
  let found = instrumentsByProvider.get(provider);
  if (!found) {
    const meter = provider.getMeter(SCOPE_NAME);
    const advice = { explicitBucketBoundaries: DURATION_BUCKETS };
    found = {
      operationDuration: meter.createHistogram("messaging.client.operation.duration", {
        unit: "s", description: "Duration of messaging operation initiated by a producer or consumer client.", advice,
      }),
      sentMessages: meter.createCounter("messaging.client.sent.messages", {
        unit: "{message}", description: "Number of messages producer attempted to send to the broker.",
      }),
      consumedMessages: meter.createCounter("messaging.client.consumed.messages", {
        unit: "{message}", description: "Number of messages that were delivered to the application.",
      }),
      processDuration: meter.createHistogram("messaging.process.duration", {
        unit: "s", description: "Duration of processing operation.", advice,
      }),
    };
    instrumentsByProvider.set(provider, found);
  }
  return found;
}

export function recordOperation(
  operation: Operation, messages: number, seconds: number, attributes: Attributes,
): void {
  const recorded = instruments();
  if (operation === "send") {
    recorded.operationDuration.record(seconds, { ...attributes, [ATTR_MESSAGING_OPERATION_TYPE]: operation });
    recorded.sentMessages.add(messages, attributes);
  } else {
    recorded.processDuration.record(seconds, attributes);
    recorded.consumedMessages.add(messages, attributes);
  }
}
