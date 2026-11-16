/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import http from "http";
import { expect } from "chai";
import { CloudEvent, CONSTANTS, HTTP, ValidationError, emitterFor, httpTransport } from "../../src";
import { PassThroughParser, parserByContentType } from "../../src/parsers";

const baseHeaders = {
  "ce-specversion": "1.0",
  "ce-id": "1",
  "ce-source": "/s",
  "ce-type": "t",
};

function structuredBody(data: unknown): string {
  return JSON.stringify({
    specversion: "1.0",
    id: "1",
    source: "/s",
    type: "t",
    data,
  });
}

describe("HTTP binding interoperability (#675)", () => {
  describe("Content-Type media type matching", () => {
    const body = structuredBody({ a: 1 });

    for (const contentType of [
      "application/cloudevents+json; charset=UTF-8",
      "application/cloudevents+json;charset=utf-8",
      "APPLICATION/CLOUDEVENTS+JSON",
      " application/cloudevents+json ; charset=UTF-8 ",
    ]) {
      it(`parses structured mode for ${JSON.stringify(contentType)}`, () => {
        const event = HTTP.toEvent({ headers: { "content-type": contentType }, body }) as CloudEvent;
        expect(event.data).to.deep.equal({ a: 1 });
      });
    }

    for (const contentType of [
      "application/cloudevents-batch+json; charset=UTF-8",
      "APPLICATION/CLOUDEVENTS-BATCH+JSON",
      "application/cloudevents-batch",
    ]) {
      it(`parses batch mode for ${JSON.stringify(contentType)}`, () => {
        const batch = HTTP.toEvent({
          headers: { "content-type": contentType },
          body: JSON.stringify([
            { specversion: "1.0", id: "1", source: "/s", type: "t", data: { a: 1 } },
          ]),
        }) as CloudEvent[];
        expect(batch).to.have.length(1);
        expect(batch[0].data).to.deep.equal({ a: 1 });
      });
    }

    for (const contentType of [
      "application/json; charset=UTF-8",
      "application/json;charset=utf-8",
      "APPLICATION/JSON",
      "application/vnd.api+json",
      "application/problem+json",
      "text/json",
    ]) {
      it(`parses a binary JSON body for ${contentType}`, () => {
        const event = HTTP.toEvent({
          headers: { ...baseHeaders, "content-type": contentType },
          body: "{\"a\":1}",
        }) as CloudEvent;
        expect(event.data).to.deep.equal({ a: 1 });
      });
    }

    it("prefers a registered parser over the +json fallback", () => {
      const custom = new PassThroughParser();
      parserByContentType["application/vnd.api+json"] = custom;
      try {
        const event = HTTP.toEvent({
          headers: {
            ...baseHeaders,
            "content-type": "application/vnd.api+json; charset=UTF-8",
          },
          body: "{\"a\":1}",
        }) as CloudEvent;
        expect(event.data).to.equal("{\"a\":1}");
      } finally {
        delete parserByContentType["application/vnd.api+json"];
      }
    });

    it("matches a custom parser registered with parameters and mixed case", () => {
      const custom = new PassThroughParser();
      parserByContentType["Application/Vnd.Custom+JSON; charset=utf-8"] = custom;
      try {
        const event = HTTP.toEvent({
          headers: { ...baseHeaders, "content-type": "application/vnd.custom+json" },
          body: "raw",
        }) as CloudEvent;
        expect(event.data).to.equal("raw");
      } finally {
        delete parserByContentType["Application/Vnd.Custom+JSON; charset=utf-8"];
      }
    });
  });

  describe("falsy data and JSON primitives", () => {
    for (const value of [0, false, "", null, true, 42]) {
      it(`round-trips structured data ${JSON.stringify(value)}`, () => {
        const event = new CloudEvent({ source: "/s", type: "t", data: value });
        const message = HTTP.structured(event);
        expect(JSON.parse(message.body as string).data).to.equal(value);
        const received = HTTP.toEvent(message) as CloudEvent;
        expect(received.data).to.equal(value);
      });
    }

    for (const value of [0, false, "", null]) {
      it(`round-trips binary data ${JSON.stringify(value)}`, () => {
        const event = new CloudEvent({ source: "/s", type: "t", data: value });
        const received = HTTP.toEvent(HTTP.binary(event)) as CloudEvent;
        expect(received.data).to.equal(value);
      });
    }

    const primitives: Array<[string, unknown]> = [
      ["0", 0],
      ["false", false],
      ["true", true],
      ["null", null],
      ["-42", -42],
      ["3.14", 3.14],
      ["\"hello\"", "hello"],
      ["[1,2]", [1, 2]],
      ["{\"a\":1}", { a: 1 }],
    ];

    for (const [raw, expected] of primitives) {
      it(`parses binary application/json body ${raw}`, () => {
        const event = HTTP.toEvent({
          headers: { ...baseHeaders, "content-type": "application/json" },
          body: raw,
        }) as CloudEvent;
        expect(event.data).to.deep.equal(expected);
      });
    }
  });

  describe("ce- header percent-encoding", () => {
    it("encodes space, percent, quote, and non-ASCII on send", () => {
      const message = HTTP.binary(new CloudEvent({
        source: "/s",
        type: "t",
        subject: "a b%c\"€",
        data: "x",
      }));
      expect(message.headers["ce-subject"]).to.equal("a%20b%25c%22%E2%82%AC");
    });

    it("leaves printable ASCII punctuation unencoded", () => {
      const subject = "a/b:c+d-e_f.g";
      const message = HTTP.binary(new CloudEvent({ source: "/s", type: "t", subject, data: "x" }));
      expect(message.headers["ce-subject"]).to.equal(subject);
    });

    it("does not percent-encode content-type", () => {
      const message = HTTP.binary(new CloudEvent({
        source: "/s",
        type: "t",
        subject: "Euro €",
        datacontenttype: "application/json; charset=utf-8",
        data: { a: 1 },
      }));
      expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal("application/json; charset=utf-8");
      expect(message.headers["ce-datacontenttype"]).to.equal(undefined);
      expect(message.headers["ce-subject"]).to.equal("Euro%20%E2%82%AC");
    });

    it("keeps boolean and integer extension values unstringified", () => {
      const message = HTTP.binary(new CloudEvent({
        source: "/s",
        type: "t",
        extboolean: false,
        extint: 0,
      }));
      expect(message.headers["ce-extboolean"]).to.equal(false);
      expect(message.headers["ce-extint"]).to.equal(0);
    });

    it("keeps an RFC 3339 extension and URI punctuation unencoded", () => {
      const message = HTTP.binary(new CloudEvent({
        source: "urn:event:from:myapi/resource/123",
        type: "t",
        extts: "2018-04-05T03:56:24+00:00",
      }));
      expect(message.headers["ce-source"]).to.equal("urn:event:from:myapi/resource/123");
      expect(message.headers["ce-extts"]).to.equal("2018-04-05T03:56:24+00:00");
    });

    it("decodes a percent-encoded subject, including lowercase hex", () => {
      const event = HTTP.toEvent({
        headers: { ...baseHeaders, "ce-subject": "Euro%20%E2%82%AC", "content-type": "text/plain" },
        body: "x",
      }) as CloudEvent;
      expect(event.subject).to.equal("Euro €");

      const lower = HTTP.toEvent({
        headers: { ...baseHeaders, "ce-subject": "Euro%20%e2%82%ac" },
        body: "x",
      }) as CloudEvent;
      expect(lower.subject).to.equal("Euro €");
    });

    it("round-trips Euro, space, quote, percent, and an emoji", () => {
      const subject = "Euro € 😀";
      const message = HTTP.binary(new CloudEvent({ source: "/s", type: "t", subject, data: "x" }));
      expect(message.headers["ce-subject"]).to.equal("Euro%20%E2%82%AC%20%F0%9F%98%80");
      const received = HTTP.toEvent(message) as CloudEvent;
      expect(received.subject).to.equal(subject);
    });

    it("accepts an unnecessarily encoded byte and decodes percent once", () => {
      const event = HTTP.toEvent({
        headers: { ...baseHeaders, "ce-subject": "%41%2520" },
        body: "x",
      }) as CloudEvent;
      expect(event.subject).to.equal("A%20");
    });

    it("trims OWS and unwraps a quoted-string before percent-decoding", () => {
      const quoted = HTTP.toEvent({
        headers: { ...baseHeaders, "ce-subject": "  \"Euro%20%E2%82%AC\"\t" },
        body: "x",
      }) as CloudEvent;
      expect(quoted.subject).to.equal("Euro €");

      const escaped = HTTP.toEvent({
        headers: { ...baseHeaders, "ce-subject": "\"say \\\"hi\\\"\"" },
        body: "x",
      }) as CloudEvent;
      expect(escaped.subject).to.equal("say \"hi\"");
    });

    it("leaves a malformed percent sequence in place", () => {
      const event = HTTP.toEvent({
        headers: { ...baseHeaders, "ce-subject": "100%2" },
        body: "x",
      }) as CloudEvent;
      expect(event.subject).to.equal("100%2");
    });

    it("rejects overlong UTF-8 percent sequences", () => {
      expect(() => HTTP.toEvent({
        headers: { ...baseHeaders, "ce-subject": "%C0%A0" },
        body: "x",
      })).to.throw(ValidationError, /invalid UTF-8/);
    });

    it("sends a non-ASCII subject through httpTransport", async () => {
      let seen: string | string[] | undefined;
      const server = http.createServer((req, res) => {
        seen = req.headers["ce-subject"];
        res.statusCode = 204;
        res.end();
      });
      await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
      });
      try {
        const addr = server.address();
        if (!addr || typeof addr === "string") {
          throw new Error("expected a TCP port");
        }
        const emit = emitterFor(httpTransport(`http://127.0.0.1:${addr.port}`));
        await emit(new CloudEvent({ source: "/s", type: "t", subject: "Euro €", data: "x" }));
        expect(seen).to.equal("Euro%20%E2%82%AC");
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        });
      }
    });
  });
});
