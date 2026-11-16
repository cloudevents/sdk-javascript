/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import {
  ROOT_CONTEXT, TraceFlags, createTraceState, defaultTextMapGetter, defaultTextMapSetter, propagation, trace,
} from "@opentelemetry/api";
import { CompositePropagator, W3CBaggagePropagator, suppressTracing } from "@opentelemetry/core";
import { CloudEventPropagator } from "../../src/otel";

const traceId = "1".repeat(32);
const spanId = "2".repeat(16);
const traceparent = `00-${traceId}-${spanId}-01`;
const creation = `00-${"3".repeat(32)}-${"4".repeat(16)}-00`;
const source = trace.setSpanContext(ROOT_CONTEXT, {
  traceId, spanId, traceFlags: TraceFlags.SAMPLED, traceState: createTraceState("vendor=transport"),
});
const propagator = new CloudEventPropagator();

describe("CloudEventPropagator", () => {
  it("Prefers W3C context and its tracestate over CloudEvents headers", () => {
    const result = propagator.extract(ROOT_CONTEXT, {
      traceparent, tracestate: "vendor=transport",
      "ce-traceparent": creation, "ce-tracestate": "vendor=creation",
    }, defaultTextMapGetter);
    expect(trace.getSpanContext(result)).to.include({
      traceId, spanId, isRemote: true, traceFlags: TraceFlags.SAMPLED,
    });
    expect(trace.getSpanContext(result)?.traceState?.serialize()).to.equal("vendor=transport");
  });

  it("Keeps tracestate paired with the selected traceparent", () => {
    const result = propagator.extract(ROOT_CONTEXT, {
      traceparent, "ce-traceparent": creation, "ce-tracestate": "vendor=creation",
    }, defaultTextMapGetter);
    expect(trace.getSpanContext(result)?.traceState).to.equal(undefined);
  });

  for (const primary of [undefined, "invalid", 42, `00-${"0".repeat(32)}-${spanId}-01`]) {
    it(`Falls back to CloudEvents when W3C context is unusable (${String(primary)})`, () => {
      const result = propagator.extract(ROOT_CONTEXT, {
        traceparent: primary, tracestate: "vendor=transport",
        "ce-traceparent": creation, "ce-tracestate": "vendor=creation",
      }, defaultTextMapGetter);
      expect(trace.getSpanContext(result)).to.include({
        traceId: "3".repeat(32), spanId: "4".repeat(16), traceFlags: TraceFlags.NONE, isRemote: true,
      });
      expect(trace.getSpanContext(result)?.traceState?.serialize()).to.equal("vendor=creation");
    });
  }

  it("Extracts the creation context even when the base already has a valid span", () => {
    const baggage = propagation.createBaggage({ tenant: { value: "store-42" } });
    const base = propagation.setBaggage(source, baggage);
    const result = propagator.extract(base, { "ce-traceparent": creation }, defaultTextMapGetter);
    expect(trace.getSpanContext(result)?.traceId).to.equal("3".repeat(32));
    expect(propagation.getBaggage(result)).to.equal(baggage);
    expect(trace.getSpanContext(base)?.traceId).to.equal(traceId);
  });

  for (const value of [undefined, "invalid", 42, `00-${traceId}-${"0".repeat(16)}-01`]) {
    it(`Returns the base context when neither format is usable (${String(value)})`, () => {
      const result = propagator.extract(source, {
        traceparent: value, "ce-traceparent": value,
      }, defaultTextMapGetter);
      expect(result).to.equal(source);
    });
  }

  it("Accepts HTTP header arrays using the W3C parsing rules", () => {
    const result = propagator.extract(ROOT_CONTEXT, {
      "ce-traceparent": [creation], "ce-tracestate": ["vendor=creation", "other=value"],
    }, defaultTextMapGetter);
    expect(trace.getSpanContext(result)?.traceId).to.equal("3".repeat(32));
    expect(trace.getSpanContext(result)?.traceState?.serialize()).to.equal("vendor=creation,other=value");
  });

  it("Uses the provided getter and setter for custom carriers and header casing", () => {
    const carrier = new Map<string, string>();
    const getter = {
      get: (map: Map<string, string>, key: string) => map.get(key.toUpperCase()),
      keys: (map: Map<string, string>) => [...map.keys()],
    };
    const setter = {
      set: (map: Map<string, string>, key: string, value: string) => map.set(key.toUpperCase(), value),
    };
    propagator.inject(source, carrier, setter);
    expect(trace.getSpanContext(propagator.extract(ROOT_CONTEXT, carrier, getter))?.traceId).to.equal(traceId);
    carrier.clear();
    carrier.set("CE-TRACEPARENT", creation);
    expect(trace.getSpanContext(propagator.extract(ROOT_CONTEXT, carrier, getter))?.traceId).to.equal("3".repeat(32));
  });

  it("Reuses a transport carrier while preserving its CloudEvents creation context", () => {
    const carrier: Record<string, string> = {
      traceparent: creation, tracestate: "old=value",
      "ce-traceparent": creation, "ce-tracestate": "vendor=creation",
    };
    for (const field of propagator.fields()) delete carrier[field];
    const withoutState = trace.setSpanContext(ROOT_CONTEXT, { traceId, spanId, traceFlags: TraceFlags.SAMPLED });
    propagator.inject(withoutState, carrier, defaultTextMapSetter);
    expect(carrier).to.deep.equal({
      traceparent, "ce-traceparent": creation, "ce-tracestate": "vendor=creation",
    });
  });

  it("Preserves the carrier when injection has no valid span or tracing is suppressed", () => {
    for (const context of [ROOT_CONTEXT, suppressTracing(source)]) {
      const carrier = { "ce-traceparent": creation };
      propagator.inject(context, carrier, defaultTextMapSetter);
      expect(carrier).to.deep.equal({ "ce-traceparent": creation });
    }
  });

  it("Composes with W3C Baggage propagation", () => {
    const combined = new CompositePropagator({ propagators: [propagator, new W3CBaggagePropagator()] });
    const result = combined.extract(ROOT_CONTEXT, {
      "ce-traceparent": creation, baggage: "tenant=store-42",
    }, defaultTextMapGetter);
    expect(trace.getSpanContext(result)?.traceId).to.equal("3".repeat(32));
    expect(propagation.getBaggage(result)?.getEntry("tenant")?.value).to.equal("store-42");
    const carrier: Record<string, string> = {};
    combined.inject(result, carrier, defaultTextMapSetter);
    expect(carrier).to.deep.equal({ traceparent: creation, baggage: "tenant=store-42" });
  });
});
