var expect = require("chai").expect;
var Parser = require("../../../lib/formats/json/parser.js");
var Cloudevent = require("../../../index.js");

const type        = "com.github.pull.create";
const source      = "urn:event:from:myapi/resourse/123";
const webhook     = "https://cloudevents.io/webhook";
const contentType = "application/cloudevents+json; charset=utf-8";
const now         = new Date();
const schemaurl   = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};

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

  it("Must accept the CloudEvent spec 0.2 as JSON", () => {
    // setup
    var payload =
      new Cloudevent(Cloudevent.specs["0.2"])
        .type(type)
        .source(source)
        .contenttype(ceContentType)
        .time(now)
        .schemaurl(schemaurl)
        .data(data)
        .toString();

    var parser = new Parser();

    // act
    var actual = parser.parse(payload);

    // assert
    expect(actual)
        .to.be.an("object");
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
