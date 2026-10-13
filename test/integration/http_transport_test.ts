/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { rejects } from "assert";
import { expect } from "chai";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import { json, text } from "stream/consumers";
import { runInNewContext } from "vm";

import {
  CONSTANTS, FetchHeadersInit, FetchRequestInit, Headers as CloudEventHeaders,
  Message, Mode, emitterFor, httpTransport,
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

  for (const statusCode of [400, 503]) {
    it(`Resolves a ${statusCode} response without retrying it`, async () => {
      let requestCount = 0;
      await withServer((_request, response) => {
        requestCount++;
        response.writeHead(statusCode);
        response.end("rejected");
      }, async (url) => {
        const result = await emitterFor(httpTransport(url))(fixture);
        expect(result.response.status).to.equal(statusCode);
        expect(result.body).to.equal("rejected");
        expect(requestCount).to.equal(1);
      });
    });
  }

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

        headers: legacyHeaders,
      });
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
  });
});

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
