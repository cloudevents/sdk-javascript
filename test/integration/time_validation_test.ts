/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { expect } from "chai";
import { CloudEvent, CONSTANTS, HTTP, V03, V1, ValidationError } from "../../src";
import { Message } from "../../src/message";
import { DateParser } from "../../src/parsers";

const source = "http://unit.test";
const type = "com.example.someevent";
const id = "0815";

const rfc3339 = "2018-04-05T17:31:00Z";
const conformanceTime = "2018-04-05T03:56:24Z";

function binaryMessage(time: string | undefined, specversion = V1): Message {
  const headers: Message["headers"] = {
    "content-type": "application/json",
    [CONSTANTS.CE_HEADERS.ID]: id,
    [CONSTANTS.CE_HEADERS.SPEC_VERSION]: specversion,
    [CONSTANTS.CE_HEADERS.TYPE]: type,
    [CONSTANTS.CE_HEADERS.SOURCE]: "my.event.source",
  };
  if (time !== undefined) {
    headers[CONSTANTS.CE_HEADERS.TIME] = time;
  }
  return { headers, body: {} };
}

function structuredMessage(time: unknown, specversion = V1): Message<string> {
  const event: Record<string, unknown> = {
    id,
    source: "my.event.source",
    type,
    specversion,
  };
  if (time !== undefined) {
    event.time = time;
  }
  return {
    headers: {
      "content-type": CONSTANTS.MIME_CE_JSON,
    },
    body: JSON.stringify(event),
  };
}

function expectInvalidTime(fn: () => unknown): void {
  expect(fn).to.throw(ValidationError, "invalid time");
}

describe("DateParser", () => {
  const parser = new DateParser();

  it("normalizes a canonical RFC 3339 timestamp to ISO 8601", () => {
    expect(parser.parse(rfc3339)).to.equal("2018-04-05T17:31:00.000Z");
    expect(parser.parse(conformanceTime)).to.equal(new Date(conformanceTime).toISOString());
  });

  it("normalizes offsets, lowercase designators, and fractional seconds", () => {
    expect(parser.parse("2018-04-05T17:31:00+01:00")).to.equal("2018-04-05T16:31:00.000Z");
    expect(parser.parse("2018-04-05T17:31:00-05:00")).to.equal("2018-04-05T22:31:00.000Z");
    expect(parser.parse("2018-04-05T17:31:00+00:00")).to.equal("2018-04-05T17:31:00.000Z");
    expect(parser.parse("2018-04-05t17:31:00z")).to.equal("2018-04-05T17:31:00.000Z");
    expect(parser.parse("2018-04-05T17:31:00.1Z")).to.equal("2018-04-05T17:31:00.100Z");
    expect(parser.parse("2018-04-05T17:31:00.123456Z")).to.equal("2018-04-05T17:31:00.123Z");
    expect(parser.parse("2020-02-29T00:00:00Z")).to.equal("2020-02-29T00:00:00.000Z");
  });

  it("throws ValidationError for a malformed timestamp instead of using the current time", () => {
    expectInvalidTime(parser.parse.bind(parser, "some invalid time string"));
  });

  it("throws ValidationError for an empty timestamp", () => {
    expectInvalidTime(parser.parse.bind(parser, ""));
  });

  it("throws ValidationError for values Date.parse accepts that are not RFC 3339 timestamps", () => {
    const notTimestamps = [
      "2018-04-05",
      "2018-04-05T17:31:00",
      "2018-04-05 17:31:00Z",
      "2018-04-05T17:31:00+0100",
      "2018-04-05T17:31:00+01",
      "2018-02-31T00:00:00Z",
      "2018-02-29T00:00:00Z",
      "2018-04-05T24:00:00Z",
      "2016-12-31T23:59:60Z",
      "2018-04-05T17:31:00+99:00",
      "   ",
      "null",
    ];
    for (const value of notTimestamps) {
      expectInvalidTime(parser.parse.bind(parser, value));
    }
  });

  it("throws ValidationError when time is not a string", () => {
    expectInvalidTime(parser.parse.bind(parser, (83 as unknown) as string));
  });
});

describe("HTTP.toEvent time attribute", () => {
  it("rejects the invalid binary ce-time from issue 386", () => {
    const message = binaryMessage("some invalid time string");
    expect(HTTP.isEvent(message)).to.equal(false);
    expectInvalidTime(() => HTTP.toEvent(message));
  });

  it("rejects an empty binary ce-time header", () => {
    expectInvalidTime(() => HTTP.toEvent(binaryMessage("")));
  });

  it("rejects an invalid structured time", () => {
    expectInvalidTime(() => HTTP.toEvent(structuredMessage("some invalid time string")));
  });

  it("rejects an empty structured time", () => {
    expectInvalidTime(() => HTTP.toEvent(structuredMessage("")));
  });

  it("rejects a non-string structured time", () => {
    expectInvalidTime(() => HTTP.toEvent(structuredMessage(1600000000000)));
  });

  it("rejects an invalid v0.3 binary ce-time", () => {
    expectInvalidTime(() => HTTP.toEvent(binaryMessage("some invalid time string", V03)));
  });

  it("rejects an invalid v0.3 structured time", () => {
    expectInvalidTime(() => HTTP.toEvent(structuredMessage("not-a-timestamp", V03)));
  });

  it("parses a valid binary ce-time as an ISO timestamp", () => {
    const event = HTTP.toEvent(binaryMessage(conformanceTime)) as CloudEvent;
    expect(event.time).to.equal(new Date(conformanceTime).toISOString());
    expect(event.id).to.equal(id);
  });

  it("parses a valid structured time, including a numeric offset", () => {
    const event = HTTP.toEvent(structuredMessage("2018-04-05T17:31:00+01:00")) as CloudEvent;
    expect(event.time).to.equal("2018-04-05T16:31:00.000Z");
  });

  it("still defaults time when the binary ce-time header is omitted", () => {
    const before = Date.now();
    const event = HTTP.toEvent(binaryMessage(undefined)) as CloudEvent;
    expect(event.time).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Math.abs(Date.parse(event.time as string) - before)).to.be.lessThan(5000);
  });

  it("still defaults time when structured JSON omits time", () => {
    const before = Date.now();
    const event = HTTP.toEvent(structuredMessage(undefined)) as CloudEvent;
    expect(event.time).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Math.abs(Date.parse(event.time as string) - before)).to.be.lessThan(5000);
  });
});

describe("CloudEvent constructor time attribute", () => {
  it("defaults time when the attribute is omitted", () => {
    const before = Date.now();
    const ce = new CloudEvent({ source, type });
    expect(ce.time).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Math.abs(Date.parse(ce.time as string) - before)).to.be.lessThan(5000);
  });

  it("defaults time when the attribute is undefined or null", () => {
    expect(new CloudEvent({ source, type, time: undefined }).time).to.match(/Z$/);
    expect(new CloudEvent({ source, type, time: (null as unknown) as string }).time).to.match(/Z$/);
  });

  it("keeps a valid RFC 3339 timestamp", () => {
    const ce = new CloudEvent({ source, type, time: rfc3339 });
    expect(ce.time).to.equal(rfc3339);
  });

  it("rejects an invalid timestamp", () => {
    expect(() => new CloudEvent({ source, type, time: "some invalid time string" })).to.throw(
      ValidationError,
      "invalid payload",
    );
  });

  it("rejects an empty timestamp instead of inventing the current time", () => {
    expect(() => new CloudEvent({ source, type, time: "" })).to.throw(ValidationError, "invalid payload");
  });

  it("rejects a Date instance because time is an RFC 3339 string", () => {
    expect(() =>
      new CloudEvent({ source, type, time: (new Date(rfc3339) as unknown) as string }),
    ).to.throw(ValidationError, "invalid payload");
  });
});
