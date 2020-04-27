var expect = require("chai").expect;
var Parser = require("../../../lib/formats/json/parser.js");

describe("JSON Event Format Parser", () => {
  it("Throw error when payload is an integer", () => {
    // setup
    var payload = 83;
    var parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("invalid payload type, allowed are: string or object");
  });

  it("Throw error when payload is null", () => {
    // setup
    var payload = null;
    var parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("null or undefined payload");
  });

  it("Throw error when payload is undefined", () => {
    // setup
    var parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser))
      .to.throw("null or undefined payload");
  });

  it("Throw error when payload is a float", () => {
    // setup
    var payload = 8.3;
    var parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("invalid payload type, allowed are: string or object");
  });

  it("Throw error when payload is an invalid JSON", () => {
    // setup
    var payload = "gg";
    var parser = new Parser();

    // act and assert
    expect(parser.parse.bind(parser, payload))
      .to.throw("Unexpected token g in JSON at position 0");
  });

  it("Must accept when the payload is a string well formed as JSON", () => {
    // setup
    var payload = "{\"much\" : \"wow\"}";
    var parser = new Parser();

    // act
    var actual = parser.parse(payload);

    // assert
    expect(actual)
      .to.be.an("object");
  });
});
