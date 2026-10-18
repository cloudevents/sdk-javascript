/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { rejects } from "assert";
import { expect } from "chai";
import { getEventListeners } from "events";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import { json, text } from "stream/consumers";
import { runInNewContext } from "vm";

import {
  CloudEvent, CONSTANTS, Headers as CloudEventHeaders, HTTPTransportError, HTTPTransportOptions,
  HTTP, Message, Mode, emitterFor, httpTransport,
} from "../../src";
import { assertStructured, fixture } from "./emitter_factory_test";

type Handler = (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
type FetchRequestInit = NonNullable<Parameters<typeof globalThis.fetch>[1]>;
type FetchHeadersInit = NonNullable<HTTPTransportOptions["headers"]>;

// nock cannot intercept fetch, so these tests use a local server

// a reserved port nothing serves
const UNREACHABLE_URL = "http://127.0.0.1:1";

// a sink which accepts every event, for tests that assert on the request rather than the response
const acceptEvent: Handler = (_request, response) => {
  response.writeHead(204);
  response.end();
};

// a sink which accepts the event, then finishes its body a moment later
const streamEvent: Handler = (_request, response) => {
  response.writeHead(202);
  response.write("stream");
  setTimeout(() => response.end("ed"), 50);
};

describe("Built-in HTTP transport", () => {
  it("Sends a binary event and resolves with the response for 2xx", async () => {
    let receivedBody: Record<string, string> | undefined;
    let receivedHeaders: IncomingMessage["headers"] | undefined;

    await withServer(async (request, response) => {
      receivedHeaders = request.headers;
      receivedBody = await json(request) as Record<string, string>;
      response.writeHead(202, { "x-request-id": "receipt-7" });
      response.end("accepted");
    }, async (url) => {
      const emit = emitterFor(httpTransport(`${url}/events`));
      const { response, body } = await emit(fixture, { headers: { "x-request-id": "order-123" } });

      expect(response.status).to.equal(202);
      expect(response.headers.get("x-request-id")).to.equal("receipt-7");
      expect(response.bodyUsed).to.equal(true);
      expect(body).to.equal("accepted");
      expectType<string | undefined>(body);
      expect(receivedHeaders?.["x-request-id"]).to.equal("order-123");
      expect(receivedHeaders?.["content-type"]).to.equal(CONSTANTS.DEFAULT_CONTENT_TYPE);
      expect(receivedHeaders?.["ce-id"]).to.equal(fixture.id);
      expect(receivedHeaders?.["ce-specversion"]).to.equal(fixture.specversion);
      expect(receivedHeaders?.["ce-type"]).to.equal(fixture.type);
      expect(receivedHeaders?.["ce-source"]).to.equal(fixture.source);
      // the extensions of the fixture become ce-* headers
      expect(receivedHeaders?.["ce-lunch"]).to.equal(fixture.lunch);
      expect(receivedHeaders?.["ce-supper"]).to.equal(fixture.supper);
      // an extension holding an object has no binary mode form; the old http.request
      // transport sent the same String() of it, and only nock kept the object itself
      expect(receivedHeaders?.["ce-snack"]).to.equal("[object Object]");
      expect(receivedBody?.lunchBreak).to.equal("noon");
    });
  });

  it("Resolves with an empty body when the sink sends none", async () => {
    await withServer(acceptEvent, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const { response, body } = await emit(fixture);

      expect(response.status).to.equal(204);
      expect(body).to.equal("");
    });
  });

  it("Sends to a sink given as a URL", async () => {
    let receivedPath: string | undefined;

    await withServer((request, response) => {
      receivedPath = request.url;
      acceptEvent(request, response);
    }, async (url) => {
      const emit = emitterFor(httpTransport(new URL(`${url}/events`)));
      const { response, body } = await emit(fixture);

      expect(response.status).to.equal(204);
      expect(body).to.equal("");
      expect(receivedPath).to.equal("/events");
    });
  });

  it("Sends a structured event", async () => {
    let received: Record<string, unknown> | undefined;

    await withServer(async (request, response) => {
      received = {
        ...await json(request) as Record<string, unknown>,
        ...request.headers,
      };
      acceptEvent(request, response);
    }, async (url) => {
      const emit = emitterFor(httpTransport(url), { mode: Mode.STRUCTURED });
      await emit(fixture);
      assertStructured(received as Record<string, Record<string, string>>);
    });
  });

  it("Keeps every value of a repeated response header", async () => {
    await withServer((_request, response) => {
      response.writeHead(202, {
        "set-cookie": ["session=abc; Path=/", "tenant=store-42; Path=/"],
      });
      response.end();
    }, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const { response } = await emit(fixture);
      const headers = response.headers as Headers & { getSetCookie(): string[] };

      expect(headers.getSetCookie()).to.deep.equal([
        "session=abc; Path=/",
        "tenant=store-42; Path=/",
      ]);
    });
  });

  it("Reports an unreadable body without failing an accepted event", async () => {
    // the sink accepts the event, then closes the connection before finishing its body
    await withServer((_request, response) => {
      response.writeHead(202);
      response.write("partial", () => response.socket?.end());
    }, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const result = await emit(fixture);

      expect(result.response.status).to.equal(202);
      expect("body" in result).to.equal(false);
      expect("bodyError" in result).to.equal(true);
      expect(result.bodyError).not.to.equal(undefined);
    });
  });

  it("Infers bodies from the transport response handler", async () => {
    await withServer((_request, response) => {
      response.writeHead(202);
      response.end("42");
    }, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        responseHandler: async (response) => ({ receipt: Number(await response.text()) }),
      }));

      const configured = await emit(fixture);
      expectType<{ receipt: number } | undefined>(configured.body);
      // @ts-expect-error the transport handler determines the body type
      expectType<string | undefined>(configured.body);
      expect(configured.body).to.deep.equal({ receipt: 42 });

      const withOptions = await emit(fixture, {
        headers: { "x-request-id": "order-123" }, signal: new AbortController().signal,
      });
      expectType<{ receipt: number } | undefined>(withOptions.body);
      expect(withOptions.body).to.deep.equal({ receipt: 42 });
    });
  });

  it("Discards a body with a caller's response handler", async () => {
    await withServer((_request, response) => {
      response.writeHead(202);
      response.end("not needed");
    }, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        responseHandler: async (response) => { await response.body?.cancel(); },
      }));
      const result = await emit(fixture);

      expectType<void | undefined>(result.body);
      expect(result.body).to.equal(undefined);
      expect(result.response.bodyUsed).to.equal(true);
      expect("bodyError" in result).to.equal(false);
    });
  });

  it("Lets a custom response handler hand its stream to the caller", async () => {
    await withServer(streamEvent, async (url) => {
      const controller = new AbortController();
      const emit = emitterFor(httpTransport(url, {
        responseHandler: async (response) => response.body,
      }));
      const result = await emit(fixture, { signal: controller.signal });

      expectType<ReadableStream<Uint8Array> | null | undefined>(result.body);
      expect(result.response.bodyUsed).to.equal(false);
      // after the handler returns the stream, cancelling it is up to the caller
      controller.abort();
      expect(await new Response(result.body).text()).to.equal("streamed");
    });
  });

  it("Returns what a custom response handler throws as bodyError for 2xx", async () => {
    const handlerError = new Error("receipt was malformed");

    await withServer((_request, response) => {
      response.writeHead(202);
      response.end("not a receipt");
    }, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        responseHandler: async () => { throw handlerError; },
      }));
      const result = await emit(fixture);

      expect(result.response.status).to.equal(202);
      expect(result.response.bodyUsed).to.equal(true);
      expect("body" in result).to.equal(false);
      expect(result.bodyError).to.equal(handlerError);
    });
  });

  it("Applies transport headers and lets per-send headers override them", async () => {
    const { received: receivedHeaders, handler } = headerCollector();

    const tracing = {
      traceparent: `00-${"a".repeat(32)}-${"b".repeat(16)}-01`,
      tracestate: "vendor=old", baggage: "tenant=store-42",
    };
    const sendTracing = {
      traceparent: `00-${"c".repeat(32)}-${"d".repeat(16)}-01`,
      tracestate: "vendor=new", baggage: "tenant=store-99,region=jp",
    };

    await withServer(handler, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        headers: new Headers({
          authorization: "Bearer transport-token",
          "x-tenant-id": "store-42",
          ...tracing,
        }),
      }));

      await emit(fixture);
      await emit(fixture, {
        headers: { "x-tenant-id": "store-99", "x-request-id": "order-123", ...sendTracing },
      });

      expect(receivedHeaders[0]?.authorization).to.equal("Bearer transport-token");
      expect(receivedHeaders[0]?.["x-tenant-id"]).to.equal("store-42");
      expect(receivedHeaders[1]?.authorization).to.equal("Bearer transport-token");
      expect(receivedHeaders[1]?.["x-tenant-id"]).to.equal("store-99");
      expect(receivedHeaders[1]?.["x-request-id"]).to.equal("order-123");
      expect(receivedHeaders[0]).to.include(tracing);
      expect(receivedHeaders[1]).to.include(sendTracing);
      // a header neither layer set keeps the value the binding produced
      expect(receivedHeaders[1]?.["ce-type"]).to.equal(fixture.type);
    });
  });

  it("Accepts new binary attributes", async () => {
    const { received, handler } = headerCollector();
    await withServer(handler, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        headers: { "ce-tenant": "store-42" },
      }));
      await emit(fixture, {
        headers: {
          "ce-region": "jp", "ce-subject": "order-123",
        },
      });
      expect(received[0]?.["ce-id"]).to.equal(fixture.id);
      expect(received[0]?.["ce-tenant"]).to.equal("store-42");
      expect(received[0]?.["ce-region"]).to.equal("jp");
      expect(received[0]?.["ce-subject"]).to.equal("order-123");
      expect(received[0]?.["content-type"]).to.equal(CONSTANTS.DEFAULT_CONTENT_TYPE);
    });
  });

  it("Rejects duplicate CloudEvents headers even with identical values", async () => {
    const repeated: Array<[Mode, string, string]> = [
      [Mode.BINARY, "CE-ID", fixture.id],
      [Mode.BINARY, "ce-id", ` ${fixture.id} `],
      [Mode.BINARY, "ce-lunch", String(fixture.lunch)],
      [Mode.BINARY, "Content-Type", CONSTANTS.DEFAULT_CONTENT_TYPE],
      [Mode.STRUCTURED, "Content-Type", CONSTANTS.DEFAULT_CE_CONTENT_TYPE],
    ];
    await withoutFetch(async () => {
      for (const [mode, name, value] of repeated) {
        const headers = { [name]: value };
        const error = { name: "TypeError", message: `cannot override CloudEvents header: ${name.toLowerCase()}` };
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL, { headers }), { mode })(fixture), error);
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL), { mode })(fixture, { headers }), error);
      }
    });
  });

  it("Rejects changes to existing CloudEvents headers at either option level", async () => {
    const changes = {
      "CE-ID": "another-id", "ce-source": "/another-source", "ce-type": "another.type",
      "ce-specversion": "0.3", "ce-lunch": "ramen", "content-type": "text/plain",
    };
    await withoutFetch(async () => {
      for (const [name, value] of Object.entries(changes)) {
        const error = { name: "TypeError", message: `cannot override CloudEvents header: ${name.toLowerCase()}` };
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL, { headers: { [name]: value } }))(fixture), error);
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL))(fixture, { headers: { [name]: value } }), error);
      }
      for (const specversion of ["0.3", "11.8"]) {
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL))(fixture.cloneWith({ specversion }), {
          headers: { "ce-id": "another-id" },
        }), TypeError);
      }
    });
  });

  it("Rejects transport overrides even if the per-send headers restore the original value", async () => {
    await withoutFetch(async () => {
      const emit = emitterFor(httpTransport(UNREACHABLE_URL, { headers: { "ce-id": "another-id" } }));
      await rejects(emit(fixture, { headers: { "ce-id": fixture.id } }), {
        name: "TypeError", message: "cannot override CloudEvents header: ce-id",
      });
    });
  });

  it("Rejects per-send overrides of CloudEvents attributes added by the transport", async () => {
    await withoutFetch(async () => {
      const emit = emitterFor(httpTransport(UNREACHABLE_URL, { headers: { "ce-tenant": "store-42" } }));
      for (const value of ["store-42", "store-99"]) {
        await rejects(emit(fixture, { headers: { "CE-TENANT": value } }), {
          name: "TypeError", message: "cannot override CloudEvents header: ce-tenant",
        });
      }
    });
  });

  it("Rejects host and content-length from Messages and either option level", async () => {
    await withoutFetch(async () => {
      for (const [name, value] of [["Host", "other.example.com"], ["Content-Length", "1"]]) {
        const error = { name: "TypeError", message: `${name.toLowerCase()} is controlled by Fetch` };
        const message = HTTP.binary(fixture);
        message.headers[name] = value;
        await rejects(httpTransport(UNREACHABLE_URL)(message), error);
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL, { headers: { [name]: value } }))(fixture), error);
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL))(fixture, { headers: { [name]: value } }), error);
      }
    });
  });

  it("Keeps binding attribute values when validating additional headers", async () => {
    const { received, handler } = headerCollector();
    const headers = { "ce-tenant": "shop" };
    await withServer(handler, async (url) => {
      for (const source of ["/orders/a%20b", "/orders/%E3%81%82"]) {
        const event = fixture.cloneWith({ source, tracestate: "vendor=25%" });
        await emitterFor(httpTransport(url, { headers }))(event);
        await emitterFor(httpTransport(url))(event, { headers });
        for (const requestHeaders of received.slice(-2)) {
          expect(requestHeaders["ce-source"]).to.equal(source);
          expect(requestHeaders["ce-tracestate"]).to.equal("vendor=25%");
        }
      }
      expect(received).to.have.length(4);
    });
  });

  it("Rejects invalid CloudEvents header additions before calling Fetch", async () => {
    const invalid: FetchHeadersInit[] = [
      { "ce-subject": "" },
      { "ce-dataschema": "/relative" },
      { "ce-bad-extension": "value" },
      { "ce-data_base64": "ZGF0YQ==" },
      { "ce-datacontenttype": "text/plain" },
    ];
    await withoutFetch(async () => {
      for (const headers of invalid) {
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL, { headers }))(fixture), TypeError);
        await rejects(emitterFor(httpTransport(UNREACHABLE_URL))(fixture, { headers }), TypeError);
      }
      const message = HTTP.binary(fixture);
      delete message.headers["ce-time"];
      await rejects(httpTransport(UNREACHABLE_URL)(message, { headers: { "ce-time": "not a timestamp" } }), TypeError);
    });
  });

  it("Accepts structured metadata headers that match the body", async () => {
    const { received, handler } = headerCollector();
    const event = new CloudEvent({
      id: "event-42", source: "/account/%2F", type: "order.created", tenant: "store-42",
      time: "2026-10-18T00:00:00Z",
    });
    await withServer(handler, async (url) => {
      const emit = emitterFor(httpTransport(url), { mode: Mode.STRUCTURED });
      await emit(event, {
        headers: new Headers({
          "CE-ID": event.id,
          "ce-source": "/account/%252F",
          "ce-type": event.type,
          "ce-time": "2026-10-18T09:00:00+09:00",
          "ce-tenant": "store-42",
        }),
      });
      expect(received[0]?.["ce-id"]).to.equal(event.id);
      expect(received[0]?.["ce-tenant"]).to.equal(event.tenant);
      expect(received[0]?.["content-type"]).to.equal(CONSTANTS.DEFAULT_CE_CONTENT_TYPE);
    });
  });

  it("Rejects content-type changes including casing and media type parameters", async () => {
    const error = { name: "TypeError", message: "cannot override CloudEvents header: content-type" };
    await withoutFetch(async () => {
      for (const mode of [Mode.BINARY, Mode.STRUCTURED]) {
        const type = mode === Mode.BINARY ? CONSTANTS.DEFAULT_CONTENT_TYPE : CONSTANTS.DEFAULT_CE_CONTENT_TYPE;
        for (const value of [type.toUpperCase(), `${type}; charset=UTF-8`]) {
          const headers = { "Content-Type": value };
          await rejects(emitterFor(httpTransport(UNREACHABLE_URL, { headers }), { mode })(fixture), error);
          await rejects(emitterFor(httpTransport(UNREACHABLE_URL), { mode })(fixture, { headers }), error);
        }
      }
    });
  });

  it("Validates added structured metadata without reinterpreting existing headers", async () => {
    const event = fixture.cloneWith({ source: "/orders/a%20b", tracestate: "vendor=25%", tenant: "shop" });
    const message = HTTP.structured(event);
    message.headers["ce-source"] = "/orders/a%2520b";
    message.headers["ce-tracestate"] = "vendor=25%25";
    const { received, handler } = headerCollector();
    await withServer(handler, async (url) => {
      await httpTransport(url)(message, { headers: { "ce-tenant": "shop" } });
      expect(received[0]?.["ce-source"]).to.equal("/orders/a%2520b");
      expect(received[0]?.["ce-tracestate"]).to.equal("vendor=25%25");
      expect(received[0]?.["ce-tenant"]).to.equal("shop");
    });
  });

  it("Checks structured additions against the body without imposing 1.0 rules on other versions", async () => {
    const { received, handler } = headerCollector();
    await withServer(handler, async (url) => {
      const emit = emitterFor(httpTransport(url), { mode: Mode.STRUCTURED });
      for (const specversion of ["0.3", "11.8"]) {
        const event = new CloudEvent({
          ...fixture, specversion, tenant: "store-42", "map-key": "value",
        }, false);
        await emit(event, { headers: { "ce-tenant": "store-42", "ce-map-key": "value" } });
        await rejects(emit(event, { headers: { "ce-tenant": "store-99" } }), {
          name: "TypeError", message: "ce-tenant does not match the structured CloudEvent body",
        });
      }
      expect(received).to.have.length(2);
    });
  });

  it("Rejects headers that conflict with the structured body before calling Fetch", async () => {
    await withoutFetch(async () => {
      const invalid: FetchHeadersInit[] = [
        { "ce-id": "different-event" },
        { "ce-tenant": "not-in-the-body" },
        { "ce-datacontenttype": "application/json" },
      ];
      const structured = emitterFor(httpTransport(UNREACHABLE_URL), { mode: Mode.STRUCTURED });
      for (const headers of invalid) {
        await rejects(structured(fixture, { headers }), TypeError);
        const configured = emitterFor(httpTransport(UNREACHABLE_URL, { headers }), { mode: Mode.STRUCTURED });
        await rejects(configured(fixture), TypeError);
      }
      const midnight = fixture.cloneWith({ time: "2026-10-18T00:00:00Z" });
      await rejects(structured(midnight, { headers: { "ce-time": "2026-10-18" } }), TypeError);
    });
  });

  it("Forwards opaque structured bodies unread and rejects metadata additions it cannot verify", async () => {
    let reads = 0;
    const stream = new ReadableStream({
      pull: () => { reads++; },
    }, { highWaterMark: 0 });
    const messages: Message[] = [
      { headers: { "content-type": CONSTANTS.DEFAULT_CE_CONTENT_TYPE }, body: stream },
      { headers: { "content-type": "application/cloudevents+avro" }, body: new Uint8Array([1, 2, 3]) },
    ];
    let requests = 0;
    await withFetch(async (_input, options) => {
      expect(options?.body).to.equal(messages[requests++].body);
      return new Response(null, { status: 204 });
    }, async () => {
      const send = httpTransport(UNREACHABLE_URL);
      for (const message of messages) {
        await rejects(send(message, { headers: { "ce-id": fixture.id } }), {
          name: "TypeError", message: "cannot verify CloudEvents headers against the structured body",
        });
        await send(message, { headers: { baggage: "tenant=store-42" } });
      }
    });
    expect(requests).to.equal(messages.length);
    expect(reads).to.equal(0);
    expect(stream.locked).to.equal(false);
  });

  it("Does not apply 1.0 extension naming or reserved header rules to other versions", async () => {
    const { received, handler } = headerCollector();
    await withServer(handler, async (url) => {
      const emit = emitterFor(httpTransport(url));
      await emit(fixture.cloneWith({ specversion: "0.3" }), {
        headers: { "ce-map-key": "value", "ce-datacontenttype": "legacy-value" },
      });
      await emit(fixture.cloneWith({ specversion: "11.8" }), {
        headers: { "ce-datacontenttype": "future-value" },
      });
      expect(received[0]?.["ce-map-key"]).to.equal("value");
      expect(received[1]?.["ce-datacontenttype"]).to.equal("future-value");
    });
  });

  it("Accepts encoded and quoted attribute values without rewriting the wire headers", async () => {
    const { received, handler } = headerCollector();
    await withServer(handler, async (url) => {
      const message = HTTP.binary(fixture);
      delete message.headers["ce-specversion"];
      for (const version of ["1%2E0", "\"1.0\""]) {
        await httpTransport(url)(message, {
          headers: {
            "ce-subject": "order%20%E2%82%AC", "ce-tenant": "\"quoted\\\"tenant\"", "ce-specversion": version,
          },
        });
      }
      expect(received[0]?.["ce-subject"]).to.equal("order%20%E2%82%AC");
      expect(received[0]?.["ce-tenant"]).to.equal("\"quoted\\\"tenant\"");
      expect(received.map((headers) => headers["ce-specversion"])).to.deep.equal(["1%2E0", "\"1.0\""]);
    });
  });

  it("Rejects malformed UTF-8 encodings in added attribute headers", async () => {
    await withoutFetch(async () => {
      const emit = emitterFor(httpTransport(UNREACHABLE_URL));
      await rejects(emit(fixture, { headers: { "ce-tenant": "%FF" } }), {
        name: "TypeError", message: "CloudEvents header values must use valid UTF-8 percent encoding",
      });
    });
  });

  it("Sends credentials from the sink URL as an authorization header", async () => {
    const { received: receivedHeaders, handler } = headerCollector();

    await withServer(handler, async (url) => {
      const { host } = new URL(url);
      const sendAs = (credentials: string) => emitterFor(httpTransport(`http://${credentials}@${host}`))(fixture);

      await sendAs("us%40er:p%40ss");
      await sendAs("user:p%C3%A4ss");
      await sendAs("user");
      // anything the caller sets wins
      await emitterFor(httpTransport(`http://user:pass@${host}`, {
        headers: { authorization: "Bearer transport-token" },
      }))(fixture);
      await emitterFor(httpTransport(`http://user:pass@${host}`))(fixture, {
        headers: { authorization: "Bearer per-send-token" },
      });

      // the credentials are percent-decoded, as the old transport decoded them
      expect(receivedHeaders[0]?.authorization).to.equal("Basic dXNAZXI6cEBzcw==");
      // non-ASCII credentials are encoded as UTF-8
      expect(receivedHeaders[1]?.authorization).to.equal("Basic dXNlcjpww6Rzcw==");
      // a URL may carry a user without a password
      expect(receivedHeaders[2]?.authorization).to.equal("Basic dXNlcjo=");
      expect(receivedHeaders[3]?.authorization).to.equal("Bearer transport-token");
      expect(receivedHeaders[4]?.authorization).to.equal("Bearer per-send-token");
    });
  });

  it("Accepts Fetch header forms without losing their contents", async () => {
    const { received: receivedHeaders, handler } = headerCollector();
    const foreignHeaders = withForeignInterfacePrototype(new Headers({ "x-realm": "foreign" }));
    expect(foreignHeaders).not.to.be.instanceOf(Headers);
    const headerForms: Array<{ headers: FetchHeadersInit; name: string; value: string }> = [
      { headers: new Headers({ "x-headers": "native" }), name: "x-headers", value: "native" },
      {
        headers: [["x-tuple", "store-42"], ["x-tuple", "store-99"]],
        name: "x-tuple",
        value: "store-42, store-99",
      },
      {
        headers: runInNewContext("({ 'x-record': 'another-realm' })") as FetchHeadersInit,
        name: "x-record",
        value: "another-realm",
      },
      { headers: foreignHeaders, name: "x-realm", value: "foreign" },
      {
        // Map is accepted by native Headers at runtime, although it is not in TypeScript's HeadersInit
        headers: new Map([["x-map", "native"]]) as unknown as FetchHeadersInit,
        name: "x-map",
        value: "native",
      },
    ];

    await withServer(handler, async (url) => {
      const emit = emitterFor(httpTransport(url));

      for (const { headers } of headerForms) {
        await emit(fixture, { headers });
      }

      headerForms.forEach(({ name, value }, index) => {
        expect(receivedHeaders[index]?.[name]).to.equal(value);
      });
    });
  });

  it("Reads Message headers the same way as caller headers", async () => {
    const { received: receivedHeaders, handler } = headerCollector();

    await withServer(handler, async (url) => {
      const send = httpTransport(url);
      const message: Message = {
        headers: {
          "content-type": "application/json",
          "x-tenant-id": null as unknown as string,
          "x-request-id": ["order-123", "order-456"],
        },
        body: `{"lunchBreak":"noon"}`,
      };

      await send(message);
      await send({
        headers: new Headers({ "x-request-id": "native-headers" }) as unknown as CloudEventHeaders,
        body: "event",
      });

      // a null value is skipped rather than sent as the string "null"
      expect(receivedHeaders[0]?.["x-tenant-id"]).to.equal(undefined);
      expect(receivedHeaders[0]?.["x-request-id"]).to.equal("order-123, order-456");
      expect(receivedHeaders[1]?.["x-request-id"]).to.equal("native-headers");
    });
  });

  it("Passes standard and platform-specific Fetch options to fetch", async () => {
    let receivedOptions: FetchRequestInit | undefined;
    const platformOptions = { dispatcher: {} };

    await withFetch(async (_input, options) => {
      receivedOptions = options;
      return new Response(null, { status: 204 });
    }, async () => {
      const emit = emitterFor(httpTransport("https://events.example.com/orders", {
        fetchOptions: {
          ...platformOptions,
          cache: "no-store",
          credentials: "include",
          redirect: "error",
        },
      }));
      await emit(fixture);
    });

    expect(receivedOptions?.cache).to.equal("no-store");
    expect(receivedOptions?.credentials).to.equal("include");
    expect(receivedOptions?.redirect).to.equal("error");
    expect(receivedOptions?.method).to.equal("POST");
    expect(receivedOptions).to.include(platformOptions);
  });

  it("Keeps the manual redirect when fetchOptions leaves redirect undefined", async () => {
    let receivedOptions: FetchRequestInit | undefined;

    await withFetch(async (_input, options) => {
      receivedOptions = options;
      return new Response(null, { status: 204 });
    }, async () => {
      const emit = emitterFor(httpTransport("https://events.example.com/orders", {
        // fetch reads an explicitly undefined redirect as absent, which would follow redirects
        fetchOptions: { redirect: undefined },
      }));
      await emit(fixture);
    });

    expect(receivedOptions?.redirect).to.equal("manual");
  });

  for (const statusCode of [400, 503]) {
    it(`Reports a ${statusCode} response without retrying it`, async () => {
      let requestCount = 0;

      await withServer((_request, response) => {
        requestCount++;
        response.writeHead(statusCode, { "x-request-id": `request-${statusCode}` });
        response.end(`status ${statusCode}`);
      }, async (url) => {
        const emit = emitterFor(httpTransport(url));
        const error = await transportErrorFrom(emit(fixture));

        expect(error.kind).to.equal("http-status");
        expect(error.response?.status).to.equal(statusCode);
        expect(error.response?.headers.get("x-request-id")).to.equal(`request-${statusCode}`);
        expect(error.body).to.equal(`status ${statusCode}`);
        expect(error.response?.bodyUsed).to.equal(true);
        expect(error.cause).to.equal(undefined);
        expect(requestCount).to.equal(1);
      });
    });
  }

  it("Applies a custom response handler to a non-2xx body", async () => {
    await withServer((_request, response) => {
      response.writeHead(422, { "content-type": "application/json" });
      response.end(`{"message":"invalid event"}`);
    }, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        responseHandler: async (response) => JSON.parse(await response.text()) as { message: string },
      }));
      const error = await transportErrorFrom(emit(fixture));

      expect(error.kind).to.equal("http-status");
      expect(error.response?.status).to.equal(422);
      expect(error.body).to.deep.equal({ message: "invalid event" });
      expect(error.cause).to.equal(undefined);
    });
  });

  for (const statusCode of [301, 302, 303]) {
    it(`Returns ${statusCode} as an error by default instead of following it`, async () => {
      let requestCount = 0;
      let targetRequestCount = 0;

      await withServer((request, response) => {
        requestCount++;
        if (request.url === "/target") {
          targetRequestCount++;
          response.writeHead(204);
        } else {
          response.writeHead(statusCode, { location: "/target" });
        }
        response.end();
      }, async (url) => {
        const emit = emitterFor(httpTransport(`${url}/start`));
        const error = await transportErrorFrom(emit(fixture));

        expect(error.kind).to.equal("http-status");
        expect(error.response?.status).to.equal(statusCode);
        expect(requestCount).to.equal(1);
        expect(targetRequestCount).to.equal(0);
      });
    });
  }

  // Fetch keeps POST only for 307 and 308, the others become a bodyless GET
  for (const { statusCode, method, keepsBody } of [
    { statusCode: 301, method: "GET", keepsBody: false },
    { statusCode: 302, method: "GET", keepsBody: false },
    { statusCode: 303, method: "GET", keepsBody: false },
    { statusCode: 307, method: "POST", keepsBody: true },
    { statusCode: 308, method: "POST", keepsBody: true },
  ]) {
    it(`Follows ${statusCode} with Fetch semantics when redirect is "follow"`, async () => {
      let originalBody = "";
      let redirectedBody = "not received";
      let redirectedMethod: string | undefined;

      await withServer(async (request, response) => {
        if (request.url === "/target") {
          redirectedMethod = request.method;
          redirectedBody = await text(request);
          response.writeHead(204);
        } else {
          originalBody = await text(request);
          response.writeHead(statusCode, { location: "/target" });
        }
        response.end();
      }, async (url) => {
        const emit = emitterFor(httpTransport(`${url}/start`, {
          fetchOptions: { redirect: "follow" },
        }));
        const { response, body } = await emit(fixture);

        expect(redirectedMethod).to.equal(method);
        expect(redirectedBody).to.equal(keepsBody ? originalBody : "");
        expect(response.url).to.equal(`${url}/target`);
        expect(body).to.equal("");
      });
    });
  }

  it("Reports a caller timeout as an abort, with the reason it carries", async () => {
    await withServer(() => undefined, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const error = await transportErrorFrom(emit(fixture, { signal: AbortSignal.timeout(50) }));

      expect(error.kind).to.equal("aborted");
      expect(error.response).to.equal(undefined);
      expect((error.cause as Error)?.name).to.equal("TimeoutError");
    });
  });

  it("Returns an abort during a 2xx body as bodyError", async () => {
    const controller = new AbortController();
    let markHandlerStarted = (): void => undefined;
    const handlerStarted = new Promise<void>((resolve) => {
      markHandlerStarted = resolve;
    });

    await withServer((_request, response) => {
      response.writeHead(202);
      response.write("partial");
    }, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        responseHandler: async (response) => {
          markHandlerStarted();
          return response.text();
        },
      }));
      const emitted = emit(fixture, { signal: controller.signal });

      await handlerStarted;
      controller.abort(new DOMException("deadline exceeded", "TimeoutError"));
      const result = await emitted;

      expect(result.response.status).to.equal(202);
      expect("body" in result).to.equal(false);
      expect((result.bodyError as Error).name).to.equal("TimeoutError");
    });
  });

  it("Reports a non-2xx status whose body cannot be read", async () => {
    // the sink starts an error body, then closes the connection before finishing it
    await withServer((_request, response) => {
      response.writeHead(503);
      response.write("partial", () => response.socket?.end());
    }, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const error = await transportErrorFrom(emit(fixture));

      expect(error.kind).to.equal("http-status");
      expect(error.response?.status).to.equal(503);
      expect(error.body).to.equal(undefined);
      expect(error.cause).not.to.equal(undefined);
    });
  });

  it("Reports an abort from a per-send signal", async () => {
    const controller = new AbortController();

    await withServer(() => controller.abort(new Error("send stopped")), async (url) => {
      const emit = emitterFor(httpTransport(url));
      const error = await transportErrorFrom(emit(fixture, { signal: controller.signal }));

      expect(error.kind).to.equal("aborted");
      expect(error.response).to.equal(undefined);
      expect((error.cause as Error).message).to.equal("send stopped");
    });
  });

  it("Keeps the transport available after one concurrent message is aborted", async () => {
    const controller = new AbortController();
    await withServer((request, response) => {
      if (request.headers["ce-id"] === "cancelled") {
        controller.abort(new Error("cancel one message"));
      } else {
        acceptEvent(request, response);
      }
    }, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const cancelled = transportErrorFrom(emit(fixture.cloneWith({ id: "cancelled" }), {
        signal: controller.signal,
      }));
      const other = emit(fixture.cloneWith({ id: "other" }));
      expect((await cancelled).kind).to.equal("aborted");
      expect((await other).response.status).to.equal(204);
      expect((await emit(fixture)).response.status).to.equal(204);
    });
  });

  it("Accepts an AbortSignal whose interface prototype comes from another realm", async () => {
    const controller = new AbortController();
    const signal = withForeignInterfacePrototype(controller.signal);
    expect(signal).not.to.be.instanceOf(AbortSignal);

    await withServer(() => controller.abort(new Error("foreign signal gave up")), async (url) => {
      const emit = emitterFor(httpTransport(url));
      const error = await transportErrorFrom(emit(fixture, { signal }));

      expect(error.kind).to.equal("aborted");
      expect((error.cause as Error).message).to.equal("foreign signal gave up");
    });
  });

  it("Does not send when the signal is already aborted", async () => {
    let requestCount = 0;
    const controller = new AbortController();
    controller.abort();

    await withServer(() => { requestCount++; }, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const error = await transportErrorFrom(emit(fixture, { signal: controller.signal }));

      expect(error.kind).to.equal("aborted");
      expect(requestCount).to.equal(0);
    });
  });

  it("Shares one source listener between concurrent sends and removes it afterward", async () => {
    const controller = new AbortController();
    let releaseRequests = (): void => undefined;
    const requestsMayComplete = new Promise<void>((resolve) => {
      releaseRequests = resolve;
    });

    await withFetch(async () => {
      await requestsMayComplete;
      return new Response(null, { status: 204 });
    }, async () => {
      const emit = emitterFor(httpTransport("https://events.example.com"));
      const emitted = Array.from({ length: 20 }, () => emit(fixture, { signal: controller.signal }));

      try {
        expect(getEventListeners(controller.signal, "abort")).to.have.length(1);
        releaseRequests();
        await Promise.all(emitted);
        expect(getEventListeners(controller.signal, "abort")).to.have.length(0);
      } finally {
        releaseRequests();
        await Promise.allSettled(emitted);
      }
    });
  });

  it("Fans a shared message signal out to every concurrent send", async () => {
    const controller = new AbortController();
    const reason = new Error("shutting down");

    await withFetch(async (_input, options) => new Promise<Response>((_resolve, reject) => {
      const signal = options?.signal;
      if (!signal) {
        reject(new Error("expected a combined abort signal"));
        return;
      }
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }), async () => {
      const emit = emitterFor(httpTransport("https://events.example.com"));
      const emitted = Array.from({ length: 20 }, () => transportErrorFrom(emit(fixture, {
        signal: controller.signal,
      })));

      try {
        expect(getEventListeners(controller.signal, "abort")).to.have.length(1);
        controller.abort(reason);
        const errors = await Promise.all(emitted);
        errors.forEach((error) => {
          expect(error.kind).to.equal("aborted");
          expect(error.cause).to.equal(reason);
        });
        expect(getEventListeners(controller.signal, "abort")).to.have.length(0);
      } finally {
        controller.abort(reason);
        await Promise.allSettled(emitted);
      }
    });
  });

  it("Rejects a per-send signal that is not an AbortSignal", async () => {
    const emit = emitterFor(httpTransport(UNREACHABLE_URL));
    await rejects(emit(fixture, { signal: "not a signal" as unknown as AbortSignal }), TypeError);
  });

  it("Rejects unsupported transport options when the transport is created", () => {
    for (const options of [
      { signal: new AbortController().signal }, { timeout: 1000 }, { timeout: undefined },
      { method: "GET" }, { url: "https://other.example" }, { mode: Mode.STRUCTURED },
      { redirect: "follow" }, { responseHanlder: async () => "receipt" },
    ]) {
      const [name] = Object.keys(options);
      expect(() => httpTransport(UNREACHABLE_URL, options as never))
        .to.throw(TypeError, `unsupported HTTP transport option: ${name}`);
    }
    expect(() => httpTransport(UNREACHABLE_URL, {
      // @ts-expect-error unsupported transport options are rejected statically
      timeout: 1000,
    })).to.throw(TypeError, "unsupported HTTP transport option: timeout");
  });

  it("Rejects unsupported message options in the transport and its emitter", async () => {
    await withoutFetch(async () => {
      const send = httpTransport(UNREACHABLE_URL);
      const emit = emitterFor(send);
      for (const options of [
        { fetchOptions: { redirect: "follow" } }, { method: "GET" },
        { url: "https://other.example" }, { mode: Mode.STRUCTURED },
        { responseHandler: async () => 42 }, { responseHandler: undefined }, { timeout: 1000 },
      ]) {
        await rejects(send({ headers: {}, body: "" }, options as never), TypeError);
        await rejects(emit(fixture, options as never), TypeError);
      }
      // @ts-expect-error Fetch options belong to the transport
      await rejects(emit(fixture, { fetchOptions: { redirect: "follow" } }), TypeError);
      // @ts-expect-error the HTTP method is fixed by the transport
      await rejects(send({ headers: {}, body: "" }, { method: "GET" }), TypeError);
      // @ts-expect-error the sink is fixed by the transport
      await rejects(emit(fixture, { url: "https://other.example" }), TypeError);
      // @ts-expect-error mode is configured when creating the emitter
      await rejects(emit(fixture, { mode: Mode.STRUCTURED }), TypeError);
      // @ts-expect-error response handlers are configured when creating the transport
      await rejects(emit(fixture, { responseHandler: async () => 42 }), TypeError);
    });
  });

  it("Rejects a per-send header that is not a valid header", async () => {
    const emit = emitterFor(httpTransport(UNREACHABLE_URL));
    // a TypeError, since nothing was sent
    await rejects(emit(fixture, { headers: { "invalid header": "value" } }), TypeError);
  });

  it("Uses native Fetch coercion for untyped header values", async () => {
    const legacyHeaders: CloudEventHeaders = { "x-tenant-id": ["store-42", "store-99"] };

    await withServer((request, response) => {
      expect(request.headers["x-tenant-id"]).to.equal("store-42,store-99");
      acceptEvent(request, response);
    }, async (url) => {
      const emit = emitterFor(httpTransport(url));
      await emit(fixture, {
        // @ts-expect-error built-in HTTP accepts FetchHeadersInit, not CloudEventHeaders arrays
        headers: legacyHeaders,
      });
    });
  });

  it("Reports a network failure with its cause", async () => {
    const emit = emitterFor(httpTransport(UNREACHABLE_URL));
    const error = await transportErrorFrom(emit(fixture));

    expect(error.kind).to.equal("network");
    expect(error.response).to.equal(undefined);
    expect(error.cause).not.to.equal(undefined);
  });

  it("Reports a synchronous Fetch failure with its cause", async () => {
    const cause = new Error("Fetch failed before returning a promise");

    await withFetch(() => { throw cause; }, async () => {
      const emit = emitterFor(httpTransport("https://events.example.com"));
      const error = await transportErrorFrom(emit(fixture));

      expect(error.kind).to.equal("network");
      expect(error.response).to.equal(undefined);
      expect(error.cause).to.equal(cause);
    });
  });

  it("Validates the sink and transport options when the transport is created", () => {
    expect(() => httpTransport("not a URL")).to.throw(TypeError);
    expect(() => httpTransport("ftp://events.example.com")).to.throw(TypeError, "unsupported protocol ftp:");
    expect(() => httpTransport("https://a%zz@events.example.com"))
      .to.throw(TypeError, "sink credentials must be percent-encoded values");
    expect(() => httpTransport("https://events.example.com", {
      headers: { "invalid header": "value" },
    })).to.throw(TypeError);
    expect(() => httpTransport("https://events.example.com", {
      headers: new Headers({ "x-tenant-id": "store-42" }),
    })).not.to.throw();
    expect(() => httpTransport("https://events.example.com", {
      responseHandler: "text" as never,
    })).to.throw(TypeError, "options.responseHandler must be a function");
  });
});

async function transportErrorFrom(emitted: Promise<unknown>): Promise<HTTPTransportError> {
  const error = await emitted.then(() => undefined, (reason: unknown) => reason);
  expect(error).to.be.instanceOf(HTTPTransportError);
  return error as HTTPTransportError;
}

// Compile-time assertion.
function expectType<T>(value: T): void {
  void value;
}

// Model a platform object from another realm: same behavior, different instanceof chain.
function withForeignInterfacePrototype<T extends AbortSignal | Headers>(value: T): T {
  const interfacePrototype = Object.getPrototypeOf(value);
  const foreignPrototype = Object.create(Object.getPrototypeOf(interfacePrototype));
  Object.defineProperties(foreignPrototype, Object.getOwnPropertyDescriptors(interfacePrototype));
  Object.setPrototypeOf(value, foreignPrototype);
  return value;
}

// A sink which records the headers of every event it accepts.
function headerCollector(): { received: IncomingMessage["headers"][]; handler: Handler } {
  const received: IncomingMessage["headers"][] = [];
  return {
    received,
    handler: (request, response) => {
      received.push(request.headers);
      acceptEvent(request, response);
    },
  };
}

async function withFetch(stub: typeof globalThis.fetch, run: () => Promise<void>): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// Runs with a Fetch that accepts everything, then checks that nothing reached it
async function withoutFetch(run: () => Promise<void>): Promise<void> {
  let requests = 0;
  await withFetch(async () => {
    requests++;
    return new Response(null, { status: 204 });
  }, run);
  expect(requests).to.equal(0);
}

export async function withServer(handler: Handler, run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    Promise.resolve(handler(request, response)).catch((error) => {
      response.destroy(error);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  }
}
