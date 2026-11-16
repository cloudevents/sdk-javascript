/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import assert from "assert";
import { AddressInfo } from "net";
import { IncomingHttpHeaders } from "http";
import { ROOT_CONTEXT, SpanContext, SpanKind, TraceFlags, context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { CompositePropagator, W3CBaggagePropagator } from "@opentelemetry/core";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { InMemorySpanExporter, SimpleSpanProcessor, TracerProvider } from "@opentelemetry/sdk-trace";
import { CloudEventPropagator, extractDistributedTracingExtension } from "../../src/otel";

async function main() {
  const scenario = process.argv[2];
  const exporter = new InMemorySpanExporter();
  const provider = new TracerProvider({ spanProcessors: [new SimpleSpanProcessor({ exporter })] });
  trace.setGlobalTracerProvider(provider);
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  propagation.setGlobalPropagator(new CompositePropagator({
    propagators: [new CloudEventPropagator(), new W3CBaggagePropagator()],
  }));
  const instrumentation = new HttpInstrumentation();
  instrumentation.enable();

  const http = await import("http");
  const { CloudEvent, HTTP, emitterFor, httpTransport } = await import("../../src");
  const creationTrace = "3".repeat(32);
  const creationSpan = "4".repeat(16);
  const creation = `00-${creationTrace}-${creationSpan}-01`;
  const transportTrace = "1".repeat(32);
  const transportSpan = "2".repeat(16);
  const event = new CloudEvent({
    id: "order-1", type: "order.created", source: "/orders", data: { orderId: 1 },
    traceparent: creation, tracestate: "vendor=creation",
  });
  let received: { headers: IncomingHttpHeaders; body: string; span?: SpanContext } | undefined;
  const server = http.createServer((req, res) => {
    const span = trace.getSpanContext(context.active());
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      received = { headers: req.headers, body, span };
      res.end("ok");
    });
  });
  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/events`;
    let senderSpanId: string | undefined;
    if (scenario === "send") {
      const parent = trace.setSpanContext(ROOT_CONTEXT, {
        traceId: transportTrace, spanId: transportSpan, traceFlags: TraceFlags.SAMPLED,
      });
      await provider.getTracer("test").startActiveSpan("sender", {}, parent, async (span) => {
        senderSpanId = span.spanContext().spanId;
        try {
          await emitterFor(httpTransport(url))(event);
        } finally {
          span.end();
        }
      });
    } else {
      const message = scenario === "structured" ? HTTP.structured(event) : HTTP.binary(event);
      const headers = new Headers();
      for (const [name, value] of Object.entries(message.headers)) {
        assert.ok(typeof value === "string");
        headers.set(name, value);
      }
      if (scenario === "transport") {
        headers.set("traceparent", `00-${transportTrace}-${transportSpan}-01`);
        headers.set("tracestate", "vendor=transport");
      } else if (scenario === "fallback") {
        headers.set("traceparent", "invalid");
        headers.set("tracestate", "vendor=transport");
      }
      // Fetch uses Undici, so this sender does not get the HTTP module's automatic injection.
      const response = await fetch(url, { method: "POST", headers, body: message.body as string });
      assert.equal(await response.text(), "ok");
    }
    await provider.forceFlush();
    assert.ok(received?.span);
    const servers = exporter.getFinishedSpans().filter((span) => span.kind === SpanKind.SERVER);
    assert.equal(servers.length, 1);
    const serverSpan = servers[0];
    assert.equal(received.span.spanId, serverSpan.spanContext().spanId);

    if (scenario === "send") {
      const clients = exporter.getFinishedSpans().filter((span) => span.kind === SpanKind.CLIENT);
      assert.equal(clients.length, 1);
      const client = clients[0];
      assert.equal(client.spanContext().traceId, transportTrace);
      assert.equal(client.parentSpanContext?.spanId, senderSpanId);
      assert.equal(serverSpan.parentSpanContext?.spanId, client.spanContext().spanId);
      assert.equal(received.headers.traceparent, `00-${transportTrace}-${client.spanContext().spanId}-01`);
      assert.equal(received.headers["ce-traceparent"], creation);
      assert.equal(received.headers["ce-tracestate"], "vendor=creation");
      assert.equal(event.traceparent, creation);
    } else if (scenario === "structured") {
      assert.equal(serverSpan.parentSpanContext, undefined);
      const decoded = HTTP.toEvent({ headers: received.headers, body: received.body });
      assert.ok(!Array.isArray(decoded));
      const extracted = extractDistributedTracingExtension(ROOT_CONTEXT, decoded);
      assert.equal(trace.getSpanContext(extracted)?.traceId, creationTrace);
    } else {
      const useTransport = scenario === "transport";
      assert.equal(serverSpan.spanContext().traceId, useTransport ? transportTrace : creationTrace);
      assert.equal(serverSpan.parentSpanContext?.spanId, useTransport ? transportSpan : creationSpan);
      assert.equal(serverSpan.parentSpanContext?.isRemote, true);
      assert.equal(received.span.traceState?.serialize(), useTransport ? "vendor=transport" : "vendor=creation");
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    instrumentation.disable();
    await provider.shutdown();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
