/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import { INVALID_SPAN_CONTEXT, context } from "@opentelemetry/api";
import { CloudEvent } from "../../src";
import { getCloudEventSpanOptions } from "../../src/otel";

const traceparent = `00-${"1".repeat(32)}-${"2".repeat(16)}-01`;
function event(extensions: Record<string, unknown> = {}) {
  return new CloudEvent({ id: "order-1", source: "/orders", type: "order.created", ...extensions });
}

describe("getCloudEventSpanOptions()", () => {
  it("Describes a single event and links to its creation context without changing it", () => {
    const original = event({ traceparent, subject: "orders/1" });
    const active = context.active();
    const result = getCloudEventSpanOptions(original);
    expect(result.attributes).to.deep.equal({
      "cloudevents.event_id": "order-1", "cloudevents.event_source": "/orders",
      "cloudevents.event_type": "order.created", "cloudevents.event_spec_version": "1.0",
      "cloudevents.event_subject": "orders/1",
    });
    expect(result.links).to.have.length(1);
    expect(result.links[0].context).to.include({ traceId: "1".repeat(32), spanId: "2".repeat(16), isRemote: true });
    expect(original.traceparent).to.equal(traceparent);
    expect(context.active()).to.equal(active);
  });

  it("Keeps attributes for a single event without a valid creation context", () => {
    for (const extensions of [{}, { traceparent: "invalid" }]) {
      const result = getCloudEventSpanOptions(event(extensions));
      expect(result.attributes["cloudevents.event_id"]).to.equal("order-1");
      expect(result.links).to.have.length(0);
    }
  });

  it("Separates shared and per-event batch attributes, including events without context", () => {
    const result = getCloudEventSpanOptions([
      event({ traceparent, subject: "orders/1" }),
      event({ id: "order-2", traceparent: `00-${"3".repeat(32)}-${"4".repeat(16)}-01` }),
      event({ id: "order-3" }),
    ]);
    expect(result.attributes).to.deep.equal({
      "cloudevents.event_source": "/orders", "cloudevents.event_type": "order.created",
      "cloudevents.event_spec_version": "1.0",
    });
    expect(result.links.map(({ context, attributes }) => [context.spanId, attributes])).to.deep.equal([
      [INVALID_SPAN_CONTEXT.spanId, { "cloudevents.event_id": "order-3" }],
      ["2".repeat(16), { "cloudevents.event_id": "order-1", "cloudevents.event_subject": "orders/1" }],
      ["4".repeat(16), { "cloudevents.event_id": "order-2" }],
    ]);
  });

  it("Retains separate event links when events share a creation context", () => {
    const result = getCloudEventSpanOptions([event({ traceparent }), event({ id: "order-2", traceparent })]);
    expect(result.links).to.have.length(2);
    expect(result.links.map((link) => link.attributes?.["cloudevents.event_id"]))
      .to.deep.equal(["order-1", "order-2"]);
  });

  it("Keeps the creation link of a one-event batch with all attributes shared", () => {
    const result = getCloudEventSpanOptions([event({ traceparent })]);
    expect(result.attributes["cloudevents.event_id"]).to.equal("order-1");
    expect(result.links).to.have.length(1);
    expect(result.links[0].attributes).to.deep.equal({});
  });

  it("Does not invent a context link when all attributes can go on the span", () => {
    const result = getCloudEventSpanOptions([event(), event()]);
    expect(result.attributes["cloudevents.event_id"]).to.equal("order-1");
    expect(result.links).to.have.length(0);
  });

  it("Returns no attributes or links for an empty batch", () => {
    expect(getCloudEventSpanOptions([])).to.deep.equal({ attributes: {}, links: [] });
  });
});
