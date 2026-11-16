/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import { ROOT_CONTEXT, TraceFlags, context, createTraceState, propagation, trace } from "@opentelemetry/api";
import { CloudEvent } from "../../src";
import { extractDistributedTracingExtension, injectDistributedTracingExtension } from "../../src/otel";

const traceId = "1".repeat(32);
const spanId = "2".repeat(16);
const traceparent = `00-${traceId}-${spanId}-01`;
const source = trace.setSpanContext(ROOT_CONTEXT, {
  traceId, spanId, traceFlags: TraceFlags.SAMPLED, traceState: createTraceState("vendor=value"),
});

function event(extensions: Record<string, unknown> = {}) {
  return new CloudEvent({
    id: "order-1", type: "com.example.order.created", source: "/orders", data: { orderId: 1 }, ...extensions,
  });
}

describe("CloudEvents trace context propagation without an OpenTelemetry SDK", () => {
  it("Round-trips the supplied trace context without activating it or changing the event", () => {
    const original = event({ custom: "kept" });
    const active = context.active();
    const injected = injectDistributedTracingExtension(source, original);
    const extracted = extractDistributedTracingExtension(ROOT_CONTEXT, injected);
    const result = trace.getSpanContext(extracted);

    expect(injected).not.to.equal(original);
    expect(injected.traceparent).to.equal(traceparent);
    expect(injected.tracestate).to.equal("vendor=value");
    expect(injected.data).to.equal(original.data);
    expect(injected.custom).to.equal("kept");
    expect(original).not.to.have.property("traceparent");
    expect(original).not.to.have.property("tracestate");
    expect(result).to.include({ traceId, spanId, traceFlags: TraceFlags.SAMPLED, isRemote: true });
    expect(result?.traceState?.serialize()).to.equal("vendor=value");
    expect(context.active()).to.equal(active);
    expect(trace.getSpanContext(ROOT_CONTEXT)).to.equal(undefined);
  });

  it("Explicitly replaces an existing extension and removes stale tracestate", () => {
    const original = event({ traceparent: `00-${"3".repeat(32)}-${"4".repeat(16)}-00`, tracestate: "old=value" });
    const withoutState = trace.setSpanContext(ROOT_CONTEXT, { traceId, spanId, traceFlags: TraceFlags.SAMPLED });
    const injected = injectDistributedTracingExtension(withoutState, original);

    expect(injected.traceparent).to.equal(traceparent);
    expect(injected).not.to.have.property("tracestate");
    expect(original.tracestate).to.equal("old=value");
    expect(original.traceparent).not.to.equal(traceparent);
  });

  it("Preserves the sampled flag when it is unset", () => {
    const unsampled = trace.setSpanContext(ROOT_CONTEXT, { traceId, spanId, traceFlags: TraceFlags.NONE });
    const injected = injectDistributedTracingExtension(unsampled, event());
    expect(trace.getSpanContext(extractDistributedTracingExtension(ROOT_CONTEXT, injected))?.traceFlags)
      .to.equal(TraceFlags.NONE);
  });

  for (const base of [ROOT_CONTEXT, trace.setSpanContext(ROOT_CONTEXT, {
    traceId: "0".repeat(32), spanId, traceFlags: TraceFlags.SAMPLED,
  })]) {
    it("Returns the original event when the supplied context has no valid span context", () => {
      const original = event({ traceparent, tracestate: "vendor=value" });
      expect(injectDistributedTracingExtension(base, original)).to.equal(original);
    });
  }

  it("Does not revalidate an event constructed with validation disabled", () => {
    const original = new CloudEvent({ id: "order-1", type: "example", source: "" }, false);
    expect(injectDistributedTracingExtension(source, original).source).to.equal("");
  });

  for (const extension of [undefined, "invalid", 42, [traceparent], `00-${"0".repeat(32)}-${spanId}-01`]) {
    it(`Preserves the input context for an absent or invalid extension (${String(extension)})`, () => {
      const original = event(extension === undefined ? {} : { traceparent: extension, tracestate: "vendor=value" });
      expect(extractDistributedTracingExtension(source, original)).to.equal(source);
    });
  }

  it("Replaces only the trace context and preserves other context values", () => {
    const baggage = propagation.createBaggage({ tenant: { value: "store-42" } });
    const base = propagation.setBaggage(source, baggage);
    const otherTraceId = "3".repeat(32);
    const extracted = extractDistributedTracingExtension(base, event({
      traceparent: `00-${otherTraceId}-${spanId}-01`,
    }));

    expect(trace.getSpanContext(extracted)?.traceId).to.equal(otherTraceId);
    expect(trace.getSpanContext(base)?.traceId).to.equal(traceId);
    expect(propagation.getBaggage(extracted)).to.equal(baggage);
  });

  it("Accepts a plain event and ignores a non-string tracestate", () => {
    const original = { ...event(), traceparent, tracestate: 42 };
    const extracted = extractDistributedTracingExtension(ROOT_CONTEXT, original);
    expect(trace.getSpanContext(extracted)?.traceId).to.equal(traceId);
    expect(trace.getSpanContext(extracted)?.traceState).to.equal(undefined);
  });
});
