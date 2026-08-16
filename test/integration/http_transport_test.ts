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
  CONSTANTS, FetchHeadersInit, FetchRequestInit, Headers as CloudEventHeaders, HTTPTransportError,
  Message, Mode, emitterFor, httpDiscardResponseHandler, httpTextResponseHandler, httpTransport,
} from "../../src";
import { assertStructured, fixture } from "./emitter_factory_test";

type Handler = (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;

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

  it("Infers bodies from transport and per-send response handlers", async () => {
    await withServer((_request, response) => {
      response.writeHead(202);
      response.end("42");
    }, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        responseHandler: async (response) => ({ receipt: Number(await response.text()) }),
      }));

      const configured = await emit(fixture);
      expectType<{ receipt: number } | undefined>(configured.body);
      // @ts-expect-error the transport handler determines the default body type
      expectType<string | undefined>(configured.body);
      expect(configured.body).to.deep.equal({ receipt: 42 });

      const overridden = await emit(fixture, { responseHandler: httpTextResponseHandler });
      expectType<string | undefined>(overridden.body);
      // @ts-expect-error the per-send handler replaces the transport body type for this call
      expectType<{ receipt: number } | undefined>(overridden.body);
      expect(overridden.body).to.equal("42");
    });
  });

  it("Discards a body with the exported response handler", async () => {
    await withServer((_request, response) => {
      response.writeHead(202);
      response.end("not needed");
    }, async (url) => {
      const emit = emitterFor(httpTransport(url));
      const result = await emit(fixture, { responseHandler: httpDiscardResponseHandler });

      expectType<void | undefined>(result.body);
      expect(result.body).to.equal(undefined);
      expect(result.response.bodyUsed).to.equal(true);
      expect("bodyError" in result).to.equal(false);
    });
  });

  it("Lets a custom response handler hand its stream to the caller", async () => {
    await withServer(streamEvent, async (url) => {
      const controller = new AbortController();
      const emit = emitterFor(httpTransport(url));
      const result = await emit(fixture, {
        signal: controller.signal,
        responseHandler: async (response) => response.body,
      });

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
      const emit = emitterFor(httpTransport(url));
      const result = await emit(fixture, {
        responseHandler: async () => { throw handlerError; },
      });

      expect(result.response.status).to.equal(202);
      expect(result.response.bodyUsed).to.equal(true);
      expect("body" in result).to.equal(false);
      expect(result.bodyError).to.equal(handlerError);
    });
  });

  it("Applies transport headers and lets per-send headers override them", async () => {
    const { received: receivedHeaders, handler } = headerCollector();

    await withServer(handler, async (url) => {
      const emit = emitterFor(httpTransport(url, {
        headers: new Headers({
          authorization: "Bearer transport-token",
          "x-tenant-id": "store-42",
        }),
      }));

      await emit(fixture);
      await emit(fixture, {
        headers: { "x-tenant-id": "store-99", "x-request-id": "order-123" },
      });

      expect(receivedHeaders[0]?.authorization).to.equal("Bearer transport-token");
      expect(receivedHeaders[0]?.["x-tenant-id"]).to.equal("store-42");
      expect(receivedHeaders[1]?.authorization).to.equal("Bearer transport-token");
      expect(receivedHeaders[1]?.["x-tenant-id"]).to.equal("store-99");
      expect(receivedHeaders[1]?.["x-request-id"]).to.equal("order-123");
      // a header neither layer set keeps the value the binding produced
      expect(receivedHeaders[1]?.["ce-type"]).to.equal(fixture.type);
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

  it("Passes standard Fetch options to fetch", async () => {
    let receivedOptions: FetchRequestInit | undefined;

    await withFetch(async (_input, options) => {
      receivedOptions = options;
      return new Response(null, { status: 204 });
    }, async () => {
      const emit = emitterFor(httpTransport("https://events.example.com/orders", {
        fetchOptions: {
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
      const emit = emitterFor(httpTransport(url));
      const emitted = emit(fixture, {
        signal: controller.signal,
        responseHandler: async (response) => {
          markHandlerStarted();
          return response.text();
        },
      });

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

  it("Reports an abort from the transport signal", async () => {
    const controller = new AbortController();

    await withServer(() => controller.abort(new Error("shutting down")), async (url) => {
      const emit = emitterFor(httpTransport(url, { signal: controller.signal }));
      const error = await transportErrorFrom(emit(fixture));

      expect(error.kind).to.equal("aborted");
      expect(error.response).to.equal(undefined);
      expect((error.cause as Error).message).to.equal("shutting down");
    });
  });

  it("Reports an abort from a per-send signal", async () => {
    const controller = new AbortController();

    await withServer(() => controller.abort(), async (url) => {
      const emit = emitterFor(httpTransport(url));
      const error = await transportErrorFrom(emit(fixture, { signal: controller.signal }));

      expect(error.kind).to.equal("aborted");
      expect(error.cause).not.to.equal(undefined);
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
      const emit = emitterFor(httpTransport(url, { signal: controller.signal }));
      const error = await transportErrorFrom(emit(fixture));

      expect(error.kind).to.equal("aborted");
      expect(requestCount).to.equal(0);
    });
  });

  it("Uses the first reason when both signals are already aborted", async () => {
    const transport = new AbortController();
    const send = new AbortController();
    transport.abort(new Error("transport stopped first"));
    send.abort(new Error("send stopped second"));

    const emit = emitterFor(httpTransport(UNREACHABLE_URL, { signal: transport.signal }));
    const error = await transportErrorFrom(emit(fixture, { signal: send.signal }));

    expect(error.kind).to.equal("aborted");
    expect((error.cause as Error).message).to.equal("transport stopped first");
  });

  it("Sends with a transport signal and a per-send signal set at once", async () => {
    const transport = new AbortController();

    await withServer(acceptEvent, async (url) => {
      const emit = emitterFor(httpTransport(url, { signal: transport.signal }));
      const { response } = await emit(fixture, { signal: new AbortController().signal });

      expect(response.status).to.equal(204);
      expect(transport.signal.aborted).to.equal(false);
    });
  });

  it("Reports an abort from either signal when both are set", async () => {
    for (const abortedSignal of ["transport", "per-send"]) {
      const transport = new AbortController();
      const send = new AbortController();
      const aborting = abortedSignal === "transport" ? transport : send;

      await withServer(() => aborting.abort(new Error(`${abortedSignal} gave up`)), async (url) => {
        const emit = emitterFor(httpTransport(url, { signal: transport.signal }));
        const error = await transportErrorFrom(emit(fixture, { signal: send.signal }));

        expect(error.kind).to.equal("aborted");
        expect((error.cause as Error).message).to.equal(`${abortedSignal} gave up`);
      });
    }
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
      const emit = emitterFor(httpTransport("https://events.example.com", { signal: controller.signal }));
      const emitted = Array.from({ length: 20 }, () => emit(fixture));

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

  it("Fans a shared transport abort out to every concurrent send", async () => {
    const controller = new AbortController();
    const reason = new Error("transport shutting down");

    await withFetch(async (_input, options) => new Promise<Response>((_resolve, reject) => {
      const signal = options?.signal;
      if (!signal) {
        reject(new Error("expected a combined abort signal"));
        return;
      }
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }), async () => {
      const emit = emitterFor(httpTransport("https://events.example.com", { signal: controller.signal }));
      const emitted = Array.from({ length: 20 }, () => transportErrorFrom(emit(fixture)));

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

  it("Stops applying a transport signal once the send has resolved", async () => {
    const transport = new AbortController();

    await withServer(streamEvent, async (url) => {
      const emit = emitterFor(httpTransport(url, { signal: transport.signal }));
      const result = await emit(fixture, {
        responseHandler: async (response) => response.body,
      });

      // the transport signal no longer reaches a body the handler handed to the caller
      transport.abort();
      expect(await new Response(result.body).text()).to.equal("streamed");
    });
  });

  it("Rejects a per-send signal that is not an AbortSignal", async () => {
    const emit = emitterFor(httpTransport(UNREACHABLE_URL));
    await rejects(emit(fixture, { signal: "not a signal" as unknown as AbortSignal }), TypeError);
  });

  it("Rejects a per-send response handler that is not a function", async () => {
    const emit = emitterFor(httpTransport(UNREACHABLE_URL));
    await rejects(emit(fixture, { responseHandler: "text" }), TypeError);
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
      signal: "not a signal" as unknown as AbortSignal,
    })).to.throw(TypeError, "options.signal must be an AbortSignal");
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

async function withServer(handler: Handler, run: (url: string) => Promise<void>): Promise<void> {
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
