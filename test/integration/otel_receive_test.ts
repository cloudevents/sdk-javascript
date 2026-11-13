/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import { runInNewContext } from "vm";
import {
  Context, ContextManager, ROOT_CONTEXT, SpanKind, SpanStatusCode, context, propagation,
} from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";

import { CloudEventV1, HTTP, Kafka, Message, ValidationError } from "../../src";
import { TracingOptions, handlerWithTracing, receiverWithTracing, withTracing } from "../../src/otel";
import {
  EVENT_SPAN_ID, EVENT_TRACEPARENT, EVENT_TRACE_ID, TRANSPORT_SPAN_ID, TRANSPORT_TRACEPARENT, TRANSPORT_TRACE_ID,
  diagErrors, errorFrom, event, exporter, extractedContext, finishedSpan, inActiveSpan, logExporter, minimalOptions,
  removeTracerProvider, spanNamed, testPropagator, tracingOptions, useTracerProvider,
} from "./otel_send_test";

type Events = CloudEventV1<unknown> | CloudEventV1<unknown>[];

const OTHER_TRACE_ID = "3".repeat(32);
const OTHER_SPAN_ID = "3".repeat(16);
const OTHER_TRACEPARENT = `00-${OTHER_TRACE_ID}-${OTHER_SPAN_ID}-01`;

function withTraceparent(message: Message, traceparent = TRANSPORT_TRACEPARENT): Message {
  return { ...message, headers: { ...message.headers, traceparent } };
}

// A batch whose events have distinct creation contexts
function batchOf(count: number): CloudEventV1<unknown>[] {
  return Array.from({ length: count }, (_, index) => {
    const id = (index + 1).toString(16);
    return event({ id: `order-${index}`, traceparent: `00-${id.padStart(32, "0")}-${id.padStart(16, "0")}-01` });
  });
}

function batchMessage(events: CloudEventV1<unknown>[], headers: Record<string, string> = {}): Message {
  return {
    headers: { "content-type": "application/cloudevents-batch+json", ...headers },
    body: JSON.stringify(events),
  };
}

describe("receiverWithTracing() without an OpenTelemetry SDK", () => {
  // These tests run after other suites registered and removed an SDK
  beforeEach(() => exporter.reset());

  it("Decodes the message and runs the handler", async () => {
    let handled: Events | undefined;
    const receive = receiverWithTracing(async (value) => {
      handled = value;
      return "processed";
    }, tracingOptions);

    expect(await receive(HTTP.binary(event()))).to.equal("processed");
    expect((handled as CloudEventV1<unknown>).id).to.equal("order-1");
    expect(exporter.getFinishedSpans()).to.have.length(0);
  });

  it("Sends and handles events when the message identifier function throws", async () => {
    const failing = {
      ...minimalOptions,
      messageId: () => {
        throw new TypeError("boom");
      },
    };

    const messages = await diagErrors(async () => {
      expect(await withTracing(async () => "sent", failing)(event())).to.equal("sent");
      expect(await handlerWithTracing(async () => "handled", failing)(event())).to.equal("handled");
    });

    expect(messages).to.have.length(2);
  });
});

describe("receiverWithTracing()", () => {
  useTracerProvider();
  const modes: Array<[string, (value: CloudEventV1<unknown>) => Message]> = [
    ["binary", HTTP.binary],
    ["structured", HTTP.structured],
  ];

  for (const [mode, encode] of modes) {
    it(`Processes an HTTP ${mode} message under its traceparent header and links to the creation context`, async () => {
      let handled: Events | undefined;
      const receive = receiverWithTracing(async (value) => {
        handled = value;
      }, tracingOptions);

      await receive(withTraceparent(encode(event({ traceparent: EVENT_TRACEPARENT }))));

      const consumer = finishedSpan(SpanKind.CONSUMER);
      expect((handled as CloudEventV1<unknown>).id).to.equal("order-1");
      expect(consumer?.name).to.equal("process orders");
      expect(consumer?.parentSpanContext?.spanId).to.equal(TRANSPORT_SPAN_ID);
      expect(consumer?.links.map((link) => link.context.spanId)).to.deep.equal([EVENT_SPAN_ID]);
      expect(consumer?.attributes).to.deep.include({
        "cloudevents.event_id": "order-1",
        "messaging.message.id": "message-order-1",
        "messaging.operation.name": "process",
        "messaging.operation.type": "process",
        "messaging.system.name": "kafka",
      });
      expect(consumer?.attributes).not.to.have.property("messaging.batch.message_count");
    });
  }

  it("Passes a batch to the handler as an array in one span which links to every event", async () => {
    const events = [
      event({ traceparent: EVENT_TRACEPARENT }),
      event({ id: "order-2", traceparent: OTHER_TRACEPARENT }),
    ];
    let handled: Events | undefined;
    const receive = receiverWithTracing(async (value) => {
      handled = value;
    }, tracingOptions);

    await receive(batchMessage(events, { traceparent: TRANSPORT_TRACEPARENT }));

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect((handled as CloudEventV1<unknown>[]).map((value) => value.id)).to.deep.equal(["order-1", "order-2"]);
    expect(exporter.getFinishedSpans()).to.have.length(1);
    expect(consumer?.parentSpanContext?.spanId).to.equal(TRANSPORT_SPAN_ID);
    expect(consumer?.attributes["messaging.batch.message_count"]).to.equal(2);
    expect(consumer?.links.map((link) => link.context.spanId)).to.deep.equal([EVENT_SPAN_ID, OTHER_SPAN_ID]);
  });

  it("Uses the headers of a Kafka message with the Kafka binding", async () => {
    const receive = receiverWithTracing(async () => undefined, { ...tracingOptions, binding: Kafka });

    await receive(withTraceparent(Kafka.binary(event({ traceparent: EVENT_TRACEPARENT }))));

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(consumer?.parentSpanContext?.spanId).to.equal(TRANSPORT_SPAN_ID);
    expect(consumer?.links.map((link) => link.context.spanId)).to.deep.equal([EVENT_SPAN_ID]);
  });

  it("Rejects a message which cannot be decoded without a span", async () => {
    const receive = receiverWithTracing(async () => undefined, tracingOptions);

    const error = await errorFrom(receive({ headers: { "content-type": "application/json" }, body: "{}" }));

    expect(error).to.be.instanceOf(ValidationError);
    expect(exporter.getFinishedSpans()).to.have.length(0);
  });
});

describe("handlerWithTracing()", () => {
  useTracerProvider();
  const handle = handlerWithTracing(async () => undefined, tracingOptions);

  it("Uses the ambient span as the parent and links only to the creation context", async () => {
    await inActiveSpan("http server", () => handle(event({ traceparent: EVENT_TRACEPARENT }),
      { traceparent: OTHER_TRACEPARENT }), extractedContext(TRANSPORT_TRACEPARENT));

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(consumer?.spanContext().traceId).to.equal(TRANSPORT_TRACE_ID);
    expect(consumer?.parentSpanContext?.spanId).to.equal(spanNamed("http server")?.spanContext().spanId);
    expect(consumer?.links.map((link) => link.context.traceId)).to.deep.equal([EVENT_TRACE_ID]);
  });

  it("Uses the creation context as the parent of a single event without other context", async () => {
    await handle(event({ traceparent: EVENT_TRACEPARENT }));

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(consumer?.parentSpanContext?.spanId).to.equal(EVENT_SPAN_ID);
    expect(consumer?.links.map((link) => link.context.spanId)).to.deep.equal([EVENT_SPAN_ID]);
  });

  it("Ignores an invalid traceparent extension", async () => {
    await handle(event({ traceparent: "invalid" }));

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(consumer?.parentSpanContext).to.equal(undefined);
    expect(consumer?.links).to.have.length(0);
  });

  it("Skips a header name without a value for the same name in another letter case", async () => {
    await handle(event(), { Traceparent: undefined, traceparent: TRANSPORT_TRACEPARENT });

    expect(finishedSpan(SpanKind.CONSUMER)?.parentSpanContext?.spanId).to.equal(TRANSPORT_SPAN_ID);
  });

  it("Reads the traceparent header in any letter case", async () => {
    await handle(event(), { TraceParent: TRANSPORT_TRACEPARENT });

    expect(finishedSpan(SpanKind.CONSUMER)?.parentSpanContext?.spanId).to.equal(TRANSPORT_SPAN_ID);
  });

  it("Passes the baggage of the headers to the handler", async () => {
    let tenant: string | undefined;
    await handlerWithTracing(async () => {
      tenant = propagation.getBaggage(context.active())?.getEntry("tenant")?.value;
    }, tracingOptions)(event(), { traceparent: TRANSPORT_TRACEPARENT, baggage: "tenant=store-42" });

    expect(tenant).to.equal("store-42");
  });

  it("Keeps the baggage of the active context when the headers become the parent", async () => {
    let region: string | undefined;
    const handleWithBaggage = handlerWithTracing(async () => {
      region = propagation.getBaggage(context.active())?.getEntry("region")?.value;
    }, tracingOptions);
    const withRegion = propagation.setBaggage(context.active(), propagation.createBaggage({ region: { value: "eu" } }));

    await context.with(withRegion, () => handleWithBaggage(event(), { traceparent: TRANSPORT_TRACEPARENT }));

    expect(region).to.equal("eu");
    expect(finishedSpan(SpanKind.CONSUMER)?.parentSpanContext?.spanId).to.equal(TRANSPORT_SPAN_ID);
  });

  it("Starts a new trace for a batch without an ambient span or headers", async () => {
    await handle([event({ traceparent: EVENT_TRACEPARENT }), event({ id: "order-2" })]);

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(consumer?.parentSpanContext).to.equal(undefined);
    expect(consumer?.spanContext().traceId).not.to.equal(EVENT_TRACE_ID);
  });

  it("Sets shared attributes on a batch span and the others on the link to each event", async () => {
    await handle([
      event({ traceparent: EVENT_TRACEPARENT }),
      event({ id: "order-2", traceparent: OTHER_TRACEPARENT }),
      event({ id: "order-3" }),
    ]);

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(consumer?.attributes).to.deep.include({
      "cloudevents.event_source": "/orders",
      "cloudevents.event_spec_version": "1.0",
      "cloudevents.event_subject": "orders/1",
      "cloudevents.event_type": "com.example.order.created",
      "messaging.batch.message_count": 3,
    });
    expect(consumer?.attributes).not.to.have.property("cloudevents.event_id");
    expect(consumer?.attributes).not.to.have.property("messaging.message.id");
    // The links without a creation context come first, as the SDK drops the oldest links over its limit
    expect(consumer?.links.map((link) => [link.context.spanId, link.attributes])).to.deep.equal([
      ["0".repeat(16), { "cloudevents.event_id": "order-3", "messaging.message.id": "message-order-3" }],
      [EVENT_SPAN_ID, { "cloudevents.event_id": "order-1", "messaging.message.id": "message-order-1" }],
      [OTHER_SPAN_ID, { "cloudevents.event_id": "order-2", "messaging.message.id": "message-order-2" }],
    ]);
  });

  it("Processes an empty batch in a span without links", async () => {
    let handled: Events | undefined;
    await handlerWithTracing(async (value: Events) => {
      handled = value;
    }, tracingOptions)([]);

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(handled).to.deep.equal([]);
    expect(consumer?.attributes["messaging.batch.message_count"]).to.equal(0);
    expect(consumer?.links).to.have.length(0);
  });

  it("Names the span after the operation alone without a destination", async () => {
    await handlerWithTracing(async () => undefined, minimalOptions)(event());

    expect(finishedSpan(SpanKind.CONSUMER)?.name).to.equal("process");
  });

  it("Records a handler failure on the span, logs it as an exception event and rejects with it", async () => {
    const error = await errorFrom(handlerWithTracing(async () => {
      throw new TypeError("boom");
    }, tracingOptions)(event()));

    const consumer = finishedSpan(SpanKind.CONSUMER);
    expect(error).to.be.instanceOf(TypeError);
    expect(consumer?.status).to.deep.equal({ code: SpanStatusCode.ERROR, message: "boom" });
    expect(consumer?.attributes["error.type"]).to.equal("TypeError");
    expect(consumer?.events).to.have.length(0);
    const logged = logExporter.getFinishedLogRecords();
    expect(logged.map((record) => [record.eventName, record.severityNumber, record.severityText])).to.deep.equal([
      ["messaging.process.exception", SeverityNumber.ERROR, "ERROR"],
    ]);
    expect(logged[0].attributes).to.deep.include({ "exception.type": "TypeError", "exception.message": "boom" });
    expect(logged[0].spanContext?.spanId).to.equal(consumer?.spanContext().spanId);
  });

  const throwingTag = {
    get [Symbol.toStringTag](): string {
      throw new Error("tag getter failed");
    },
    toString: () => "original failure",
  };
  const unprintable = {
    [Symbol.toPrimitive]: () => {
      throw new Error("conversion failed");
    },
  };
  // The last value is the exception.type of the log record, which the SDK takes from the error name
  const failures: Array<[string, unknown, string, string, string | undefined]> = [
    [
      "the class name of an error",
      new ValidationError("invalid order"), "ValidationError", "invalid order", "TypeError",
    ],
    ["the class name of an error from another realm", runInNewContext("new Error('invalid order')"), "Error",
      "invalid order", "Error"],
    ["_OTHER for a string", "invalid order", "_OTHER", "invalid order", undefined],
    ["_OTHER for undefined", undefined, "_OTHER", "undefined", undefined],
    ["_OTHER for a symbol", Symbol("invalid order"), "_OTHER", "Symbol(invalid order)", undefined],
    ["_OTHER when inspecting the value throws", throwingTag, "_OTHER", "original failure", undefined],
    ["_OTHER when converting the value throws", unprintable, "_OTHER", "Unknown exception", undefined],
  ];
  for (const [label, failure, errorType, message, exceptionType] of failures) {
    it(`Sets error.type to ${label} and logs its message`, async () => {
      const rejected = await errorFrom(handlerWithTracing(async () => {
        throw failure;
      }, tracingOptions)(event()));

      const consumer = finishedSpan(SpanKind.CONSUMER);
      const [logged] = logExporter.getFinishedLogRecords();
      expect(rejected).to.equal(failure);
      expect(consumer?.status).to.deep.equal({ code: SpanStatusCode.ERROR, message });
      expect(consumer?.attributes["error.type"]).to.equal(errorType);
      expect(logged.attributes["exception.message"]).to.equal(message);
      expect(logged.attributes["exception.type"]).to.equal(exceptionType);
      expect(logged.attributes["exception.stacktrace"] !== undefined).to.equal(exceptionType !== undefined);
    });
  }

  it("Keeps the SDK's exception attributes for an error-like object", async () => {
    const failure = { name: "DeliveryError", message: "delivery failed", stack: "DeliveryError: delivery failed" };
    const rejected = await errorFrom(handleFailure(failure));

    expect(rejected).to.equal(failure);
    expect(logExporter.getFinishedLogRecords()[0].attributes).to.deep.include({
      "exception.type": failure.name,
      "exception.message": failure.message,
      "exception.stacktrace": failure.stack,
    });
  });

  it("Adds a fallback message without dropping a thrown object's stack", async () => {
    const failure = { stack: "at processOrder (orders.js:42:1)" };
    const rejected = await errorFrom(handleFailure(failure));

    expect(rejected).to.equal(failure);
    expect(logExporter.getFinishedLogRecords()[0].attributes).to.deep.include({
      "exception.message": "[object Object]",
      "exception.stacktrace": failure.stack,
    });
  });

  function handleFailure(failure: unknown): Promise<unknown> {
    return handlerWithTracing(async () => {
      throw failure;
    }, tracingOptions)(event());
  }

  it("Runs the handler without the message identifier and logs to diag when its function throws", async () => {
    let handled = false;
    const handleFailing = handlerWithTracing(async () => {
      handled = true;
    }, {
      ...minimalOptions,
      messageId: () => {
        throw new TypeError("boom");
      },
    });

    const messages = await diagErrors(() => handleFailing(event()));

    expect(handled).to.equal(true);
    expect(finishedSpan(SpanKind.CONSUMER)?.attributes).not.to.have.property("messaging.message.id");
    expect(messages).to.deep.equal(["cloudevents: messageId() threw, so messaging.message.id is left out"]);
  });

  it("Requires a handler and a messaging system", () => {
    expect(() => handlerWithTracing(undefined as unknown as () => Promise<void>, minimalOptions))
      .to.throw(TypeError, "A handler function is required");
    expect(() => handlerWithTracing(async () => undefined, {} as TracingOptions))
      .to.throw(TypeError, "options.system is required");
  });
});

// Like the stack context manager of browsers, it does not keep the active context across await
class SyncContextManager implements ContextManager {
  private current: Context = ROOT_CONTEXT;

  active(): Context {
    return this.current;
  }

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    target: Context, fn: F, thisArg?: ThisParameterType<F>, ...args: A
  ): ReturnType<F> {
    const previous = this.current;
    this.current = target;
    try {
      return fn.call(thisArg, ...args);
    } finally {
      this.current = previous;
    }
  }

  bind<T>(_target: Context, value: T): T {
    return value;
  }

  enable(): this {
    return this;
  }

  disable(): this {
    this.current = ROOT_CONTEXT;
    return this;
  }
}

describe("handlerWithTracing() with a context manager which does not follow await", () => {
  useTracerProvider({ contextManager: new SyncContextManager() });

  it("Associates the exception event with the span of the operation", async () => {
    await errorFrom(handlerWithTracing(async () => {
      await Promise.resolve();
      throw new TypeError("boom");
    }, tracingOptions)(event()));

    const [logged] = logExporter.getFinishedLogRecords();
    expect(logged.spanContext?.spanId).to.equal(finishedSpan(SpanKind.CONSUMER)?.spanContext().spanId);
  });
});

describe("handlerWithTracing() with a configured propagator", () => {
  useTracerProvider({ propagator: testPropagator });

  it("Reads the parent from the headers with the configured propagator, in any letter case", async () => {
    await handlerWithTracing(async () => undefined, tracingOptions)(event(), {
      "x-test-trace": `${TRANSPORT_TRACE_ID}-${TRANSPORT_SPAN_ID}`,
      traceparent: OTHER_TRACEPARENT,
    });

    expect(finishedSpan(SpanKind.CONSUMER)?.parentSpanContext?.spanId).to.equal(TRANSPORT_SPAN_ID);
  });
});

describe("handlerWithTracing() and the link limit of the SDK", () => {
  const handle = handlerWithTracing(async () => undefined, tracingOptions);

  describe("with the default limit", () => {
    useTracerProvider();

    it("Drops the links beyond the default limit of 128", async () => {
      await handle(batchOf(130));

      const consumer = finishedSpan(SpanKind.CONSUMER);
      expect(consumer?.links).to.have.length(128);
      expect(consumer?.droppedLinksCount).to.equal(2);
    });

    it("Keeps the links to creation contexts when the links without one exceed the limit", async () => {
      const withoutCreation = Array.from({ length: 129 }, (_, index) => event({ id: `order-${index}` }));

      await handle([event({ id: "created", traceparent: EVENT_TRACEPARENT }), ...withoutCreation]);

      expect(finishedSpan(SpanKind.CONSUMER)?.links.map((link) => link.context.spanId)).to.include(EVENT_SPAN_ID);
    });
  });

  describe("with a raised limit", () => {
    // OTEL_SPAN_LINK_COUNT_LIMIT raises the same limit without changing the code
    const limitless = new InMemorySpanExporter();
    before(() => new NodeTracerProvider({
      spanLimits: { linkCountLimit: Infinity },
      spanProcessors: [new SimpleSpanProcessor(limitless)],
    }).register());
    after(removeTracerProvider);

    it("Links to every event of a batch larger than the default limit", async () => {
      await handle(batchOf(130));

      const [consumer] = limitless.getFinishedSpans();
      expect(consumer.links).to.have.length(130);
      expect(consumer.droppedLinksCount).to.equal(0);
    });
  });
});
