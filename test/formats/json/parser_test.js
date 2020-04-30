const expect = require("chai").expect;
const Parser = require("../../../lib/formats/json/parser.js");

describe("JSON Event Format Parser", () => {
  it("Throw error when payload is an integer", () => {
    // setup
    const payload = 83;
    const parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("invalid payload type, allowed are: string or object");
  });

  it("Throw error when payload is null", () => {
    // setup
    const payload = null;
    const parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("null or undefined payload");
  });

  it("Throw error when payload is undefined", () => {
    // setup
    const parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser))
      .to.throw("null or undefined payload");
  });

  it("Throw error when payload is a float", () => {
    // setup
    const payload = 8.3;
    const parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("invalid payload type, allowed are: string or object");
  });

  it("Throw error when payload is an invalid JSON", () => {
    // setup
    const payload = "gg";
    const parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("Unexpected token g in JSON at position 0");
  });

  it("Must accept when the payload is a string well formed as JSON", () => {
    // setup
    const payload = "{\"much\" : \"wow\"}";
    const parser = new Parser();

    // act
    const actual = parser.parse(payload);

    // assert
    expect(actual)
      .to.be.an("object");
  });
});
