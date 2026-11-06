/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";

import { DateParser, JSONParser as Parser } from "../../src/parsers";
import { CloudEvent, ValidationError } from "../../src/";
import { HTTP } from "../../src/message";

describe("JSON Event Format Parser", () => {
  it("Throw error when payload is an integer", () => {
    // setup
    const payload = 83;
    const parser = new Parser();

    expect(parser.parse.bind(parser, (payload as unknown) as string)).to.throw(
      ValidationError,
      "invalid payload type, allowed are: string or object",
    );
  });

  it("Throw error when payload is null", () => {
    const payload = null;
    const parser = new Parser();

    expect(parser.parse.bind(parser, (payload as unknown) as string)).to.throw(
      ValidationError,
      "null or undefined payload",
    );
  });

  it("Throw error when payload is undefined", () => {
    // setup
    const parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser)).to.throw(ValidationError, "null or undefined payload");
  });

  it("Throw error when payload is a float", () => {
    // setup
    const payload = 8.3;
    const parser = new Parser();

    expect(parser.parse.bind(parser, (payload as unknown) as string)).to.throw(
      ValidationError,
      "invalid payload type, allowed are: string or object",
    );
  });

  it("Throw error when payload is an invalid JSON", () => {
    // setup
    const payload = "{gg";
    const parser = new Parser();

    // TODO: Should the parser catch the SyntaxError and re-throw a ValidationError?
    expect(parser.parse.bind(parser, payload)).to.throw(SyntaxError);
  });

  it("Accepts a string as valid JSON", () => {
    // setup
    const payload = "I am a string!";
    const parser = new Parser();

    expect(parser.parse(payload)).to.equal("I am a string!");
  });

  it("Must accept when the payload is a string well formed as JSON", () => {
    // setup
    const payload = "{\"much\" : \"wow\"}";
    const parser = new Parser();

    // act
    const actual = parser.parse(payload);

    // assert
    expect(actual).to.be.an("object");
  });
});

describe("Date Parser", () => {
  const parser = new DateParser();

  it("Returns an RFC 3339 UTC timestamp unchanged", () => {
    expect(parser.parse("2018-04-05T17:31:00.000Z")).to.equal("2018-04-05T17:31:00.000Z");
  });

  it("Normalizes an RFC 3339 timestamp with an offset to UTC", () => {
    expect(parser.parse("2018-04-05T17:31:00+02:00")).to.equal("2018-04-05T15:31:00.000Z");
  });

  it("Falls back to the current time when the payload is not a date", () => {
    const before = Date.now();
    const parsed = Date.parse(parser.parse("not a date"));
    const after = Date.now();
    expect(parsed).to.be.at.least(before).and.at.most(after);
  });

  it("Does not throw when a binary message carries an unparseable ce-time header", () => {
    const message = {
      headers: {
        "ce-id": "1234",
        "ce-source": "test",
        "ce-type": "test.event",
        "ce-specversion": "1.0",
        "ce-time": "garbage",
        "content-type": "application/json",
      },
      body: "{}",
    };
    const event = HTTP.toEvent(message) as CloudEvent;
    expect(Number.isNaN(Date.parse(event.time as string))).to.equal(false);
    expect(() => event.validate()).not.to.throw();
  });
});
