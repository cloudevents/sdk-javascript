/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";

import { JSONParser as Parser } from "../../src/parsers";
import { ValidationError } from "../../src/";

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
    expect(parser.parse.bind(parser, payload)).to.throw(SyntaxError, "Unexpected token g in JSON at position 1");
  });

  it("Accepts a string as valid JSON", () => {
    // setup
    const payload = "I am a string!";
    const parser = new Parser();

    expect(parser.parse(payload)).to.equal("I am a string!");
  });

  it("Must accept when the payload is a string well formed as JSON", () => {
    // setup
    // eslint-disable-next-line prettier/prettier
    const payload = "{\"much\" : \"wow\"}";
    const parser = new Parser();

    // act
    const actual = parser.parse(payload);

    // assert
    expect(actual).to.be.an("object");
  });
});
