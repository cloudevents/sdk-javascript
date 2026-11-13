/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import { Attributes, metrics } from "@opentelemetry/api";
import { MeterProvider, MetricData, MetricReader } from "@opentelemetry/sdk-metrics";
import {
  InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor, SpanProcessor,
} from "@opentelemetry/sdk-trace-node";

import { TracingOptions, handlerWithTracing, receiverWithTracing, withTracing } from "../../src/otel";
import {
  errorFrom, event, exporter, removeTracerProvider, tracingOptions, useTracerProvider,
} from "./otel_send_test";

const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10];

const operation = {
  "messaging.system.name": "kafka",
  "messaging.destination.name": "orders",
  "server.address": "broker.example.com",
  "server.port": 9092,
};

class TestReader extends MetricReader {
  protected async onForceFlush(): Promise<void> {
    return undefined;
  }

  protected async onShutdown(): Promise<void> {
    return undefined;
  }
}

interface HistogramValue {
  count: number;
  sum: number;
  buckets: { boundaries: number[] };
}

describe("OpenTelemetry messaging metrics", () => {
  let reader: TestReader;

  // A new meter provider for each test starts every metric from zero
  beforeEach(() => {
    metrics.disable();
    reader = new TestReader();
    metrics.setGlobalMeterProvider(new MeterProvider({ readers: [reader] }));
  });
  after(() => metrics.disable());

  async function collected(name: string): Promise<MetricData | undefined> {
    const { resourceMetrics } = await reader.collect();
    return resourceMetrics.scopeMetrics.flatMap((scope) => scope.metrics)
      .find((metric) => metric.descriptor.name === name);
  }

  it("Records a send in the operation duration and sent message metrics", async () => {
    await withTracing(async () => "sent", tracingOptions)(event());

    const duration = await collected("messaging.client.operation.duration");
    const sent = await collected("messaging.client.sent.messages");
    expect(duration?.descriptor.unit).to.equal("s");
    expect(duration?.dataPoints.map((point) => point.attributes)).to.deep.equal([
      { ...operation, "messaging.operation.name": "send", "messaging.operation.type": "send" },
    ]);
    expect((duration?.dataPoints[0].value as HistogramValue).count).to.equal(1);
    expect((duration?.dataPoints[0].value as HistogramValue).buckets.boundaries).to.deep.equal(DURATION_BUCKETS);
    expect(sent?.descriptor.unit).to.equal("{message}");
    expect(sent?.dataPoints.map((point) => [point.attributes, point.value])).to.deep.equal([
      [{ ...operation, "messaging.operation.name": "send" }, 1],
    ]);
  });

  it("Adds error.type to the send metrics when the send fails", async () => {
    await errorFrom(withTracing(async () => {
      throw new TypeError("boom");
    }, tracingOptions)(event()));

    for (const name of ["messaging.client.operation.duration", "messaging.client.sent.messages"]) {
      const metric = await collected(name);
      expect(metric?.dataPoints[0].attributes["error.type"], name).to.equal("TypeError");
    }
  });

  it("Records processing and the number of delivered messages", async () => {
    await handlerWithTracing(async () => undefined, tracingOptions)(event());

    const duration = await collected("messaging.process.duration");
    const consumed = await collected("messaging.client.consumed.messages");
    expect(duration?.descriptor.unit).to.equal("s");
    expect(duration?.dataPoints.map((point) => point.attributes)).to.deep.equal([
      { ...operation, "messaging.operation.name": "process" },
    ]);
    expect((duration?.dataPoints[0].value as HistogramValue).count).to.equal(1);
    expect((duration?.dataPoints[0].value as HistogramValue).buckets.boundaries).to.deep.equal(DURATION_BUCKETS);
    expect(consumed?.dataPoints.map((point) => [point.attributes, point.value])).to.deep.equal([
      [{ ...operation, "messaging.operation.name": "process" }, 1],
    ]);
  });

  it("Counts every message of a batch and records one processing duration", async () => {
    await handlerWithTracing(async () => undefined, tracingOptions)([event(), event({ id: "order-2" })]);

    const duration = await collected("messaging.process.duration");
    const consumed = await collected("messaging.client.consumed.messages");
    expect((duration?.dataPoints[0].value as HistogramValue).count).to.equal(1);
    expect(consumed?.dataPoints[0].value).to.equal(2);
  });

  it("Adds error.type to the processing metrics when the handler fails", async () => {
    await errorFrom(handlerWithTracing(async () => {
      throw new TypeError("boom");
    }, tracingOptions)(event()));

    for (const name of ["messaging.process.duration", "messaging.client.consumed.messages"]) {
      const metric = await collected(name);
      expect(metric?.dataPoints[0].attributes["error.type"], name).to.equal("TypeError");
    }
  });

  const operations: Array<[string, string, () => Promise<unknown>]> = [
    ["a send", "messaging.client.operation.duration", () => withTracing(async () => "sent", tracingOptions)(event())],
    [
      "processing",
      "messaging.process.duration",
      () => handlerWithTracing(async () => "handled", tracingOptions)(event()),
    ],
  ];
  for (const [label, name, operate] of operations) {
    it(`Measures the same time as the span of ${label}, even with a slow span processor`, async () => {
      const spans = new InMemorySpanExporter();
      const slowStart: SpanProcessor = {
        onStart: () => {
          const until = Date.now() + 20;
          while (Date.now() < until) {
            // a span processor which takes 20 ms to start each span
          }
        },
        onEnd: () => undefined,
        forceFlush: async () => undefined,
        shutdown: async () => undefined,
      };
      new NodeTracerProvider({ spanProcessors: [slowStart, new SimpleSpanProcessor(spans)] }).register();
      try {
        await operate();
      } finally {
        removeTracerProvider();
      }

      const [span] = spans.getFinishedSpans();
      const metricSeconds = ((await collected(name))?.dataPoints[0].value as HistogramValue).sum;
      expect(Math.abs(metricSeconds - (span.duration[0] + span.duration[1] / 1e9))).to.be.below(0.005);
    });
  }

  it("Records nothing for a message which cannot be decoded", async () => {
    await errorFrom(receiverWithTracing(async () => undefined, tracingOptions)({ headers: {}, body: "{}" }));

    const { resourceMetrics } = await reader.collect();
    const points = resourceMetrics.scopeMetrics.flatMap((scope) => scope.metrics)
      .reduce((count, metric) => count + metric.dataPoints.length, 0);
    expect(points).to.equal(0);
  });

  describe("for each kind of destination", () => {
    useTracerProvider();

    const NAME = "messaging.destination.name";
    const TEMPLATE = "messaging.destination.template";
    const kinds: Array<[string, TracingOptions["destination"], string, Attributes, Attributes]> = [
      ["a fixed low-cardinality name", "orders", "orders", { [NAME]: "orders" }, { [NAME]: "orders" }],
      [
        "a high-cardinality name with a template",
        { name: "orders.t42", template: "orders.{tenant}" },
        "orders.{tenant}",
        { [NAME]: "orders.t42", [TEMPLATE]: "orders.{tenant}" },
        { [TEMPLATE]: "orders.{tenant}" },
      ],
      ["a high-cardinality name without a template", { name: "orders.t42" }, "", { [NAME]: "orders.t42" }, {}],
      [
        "a temporary or anonymous high-cardinality name",
        { name: "amq.gen-x1", temporaryOrAnonymous: true },
        "",
        { [NAME]: "amq.gen-x1" },
        {},
      ],
      [
        "a temporary or anonymous name with a template",
        { name: "amq.gen-x1", template: "amq.gen-{id}", temporaryOrAnonymous: true },
        "amq.gen-{id}",
        { [NAME]: "amq.gen-x1", [TEMPLATE]: "amq.gen-{id}" },
        { [TEMPLATE]: "amq.gen-{id}" },
      ],
      [
        "a temporary low-cardinality name",
        { name: "replies", lowCardinality: true, temporaryOrAnonymous: true },
        "",
        { [NAME]: "replies" },
        { [NAME]: "replies" },
      ],
      [
        "a low-cardinality name with a template",
        { name: "orders.eu", template: "orders.{region}", lowCardinality: true },
        "orders.{region}",
        { [NAME]: "orders.eu", [TEMPLATE]: "orders.{region}" },
        { [NAME]: "orders.eu", [TEMPLATE]: "orders.{region}" },
      ],
    ];
    const operations: Array<[string, string[], (options: TracingOptions) => Promise<unknown>]> = [
      [
        "send",
        ["messaging.client.operation.duration", "messaging.client.sent.messages"],
        (options) => withTracing(async () => "sent", options)(event()),
      ],
      [
        "process",
        ["messaging.process.duration", "messaging.client.consumed.messages"],
        (options) => handlerWithTracing(async () => "handled", options)(event()),
      ],
    ];
    const destinationOf = (attributes: Attributes | undefined): Attributes =>
      Object.fromEntries(Object.entries(attributes ?? {}).filter(([key]) => key === NAME || key === TEMPLATE));

    for (const [label, destination, spanName, onSpan, inMetrics] of kinds) {
      for (const [operationName, metricNames, operate] of operations) {
        it(`Names the ${operationName} span and records ${label} on spans and metrics`, async () => {
          await operate({ system: "kafka", destination });

          const [span] = exporter.getFinishedSpans();
          expect(span.name).to.equal(spanName ? `${operationName} ${spanName}` : operationName);
          expect(destinationOf(span.attributes)).to.deep.equal(onSpan);
          for (const metricName of metricNames) {
            const metric = await collected(metricName);
            expect(metric, metricName).not.to.equal(undefined);
            expect(metric?.dataPoints, metricName).to.have.length(1);
            expect(destinationOf(metric?.dataPoints[0].attributes), metricName).to.deep.equal(inMetrics);
          }
        });
      }
    }
  });
});
