var expect = require("chai").expect;
var Unmarshaller = require("../../../lib/bindings/http/unmarshaller_0_2.js");
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

describe("HTTP Transport Binding Unmarshaller", () => {

  it("Throw error when payload is null", () => {
    // setup
    var payload = null;
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload))
        .to.throw("payload is null or undefined");
  });

  it("Throw error when headers is null", () => {
    // setup
    var payload = {};
    var headers = null;
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("headers is null or undefined");
  });

  it("Throw error when there is no content-type header", () => {
    // setup
    var payload = {};
    var headers = {};
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("content-type header not found");
  });

  it("Throw error when content-type is not allowed", () => {
    // setup
    var payload = {};
    var headers = {
      "content-type":"text/xml"
    };
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("content type not allowed");
  });

  describe("Structured", () => {
    it("Throw error when has not allowed mime", () => {
      // setup
      var payload = {};
      var headers = {
        "content-type":"application/cloudevents+zip"
      };
      var un = new Unmarshaller();

      // act and assert
      expect(un.unmarshall.bind(un, payload, headers))
          .to.throw("structured+type not allowed");
    });

    it("Throw error when the event does not follow the spec 0.2", () => {
      // setup
      var payload =
        new Cloudevent()
          .type(type)
          .source(source)
          .contenttype(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .data(data)
          .toString();

      var headers = {
        "content-type":"application/cloudevents+json"
      };

      var un = new Unmarshaller();

      // act and assert
      expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("invalid payload");
    });
  });
});
