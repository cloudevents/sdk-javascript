var expect     = require("chai").expect;
var v03 = require("../../../v03/index.js");
var Cloudevent = require("../../../index.js");
var Spec     = require("../../../lib/specs/spec_0_3.js");

var HTTPStructuredReceiver =
  require("../../../lib/bindings/http/receiver_structured_0_3.js");

var receiver = new HTTPStructuredReceiver();

const type        = "com.github.pull.create";
const source      = "urn:event:from:myapi/resourse/123";
const webhook     = "https://cloudevents.io/webhook";
const contentEncoding = "base64";
const contentType = "application/cloudevents+json; charset=utf-8";
const now         = new Date();
const schemaurl   = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};
const dataBase64 = "Y2xvdWRldmVudHMK";

const ext1Name  = "extension1";
const ext1Value = "foobar";
const ext2Name  = "extension2";
const ext2Value = "acme";

var cloudevent = v03.event()
    .type(type)
    .source(source)
    .contenttype(ceContentType)
    .time(now)
    .schemaurl(schemaurl)
    .data(data)
    .addExtension(ext1Name, ext1Value)
    .addExtension(ext2Name, ext2Value);

const cebase64 = v03.event()
    .type(type)
    .source(source)
    .dataContentType(ceContentType)
    .dataContentEncoding(contentEncoding)
    .time(now)
    .schemaurl(schemaurl)
    .data(dataBase64)
    .addExtension(ext1Name, ext1Value)
    .addExtension(ext2Name, ext2Value);

describe("HTTP Transport Binding Structured Receiver for CloudEvents v0.3", () => {
  describe("Check", () => {
    it("Throw error when payload arg is null or undefined", () => {
      // setup
      var payload = null;
      var attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("payload is null or undefined");
    });

    it("Throw error when attributes arg is null or undefined", () => {
      // setup
      var payload = {};
      var attributes = null;

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("attributes is null or undefined");
    });

    it("Throw error when payload is not an object or string", () => {
      // setup
      var payload = 1.0;
      var attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("payload must be an object or string");
    });

    it("Throw error when the content-type is invalid", () => {
      // setup
      var payload = {};
      var attributes = {
        "Content-Type" : "text/html"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("invalid content type");
    });

    it("Throw error data content encoding is base64, but 'data' is not", () => {
      // setup
      let payload = v03.event()
          .type(type)
          .source(source)
          .dataContentType("text/plain")
          .dataContentEncoding("base64")
          .time(now)
          .schemaurl(schemaurl)
          .data("No base 64 value")
          .addExtension(ext1Name, ext1Value)
          .addExtension(ext2Name, ext2Value)
          .toString();

      let attributes = {
        "Content-Type" : "application/cloudevents+json"
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes))
        .to.throw("invalid payload");
    });

    it("No error when all required stuff are in place", () => {
      // setup
      var payload = {};
      var attributes = {
        "Content-Type" : "application/cloudevents+json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.not.throw();
    });
  });

  describe("Parse", () => {
    it("Throw error when the event does not follow the spec", () => {
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
        "Content-Type":"application/cloudevents+json"
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, headers))
        .to.throw("invalid payload");
    });

    it("Should accept event that follows the spec", () => {
      // setup
      var id = "id-x0dk";
      var payload = v03.event()
          .type(type)
          .source(source)
          .id(id)
          .contenttype(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .data(data)
          .toString();
      var headers = {
        "content-type":"application/cloudevents+json"
      };

      // act
      var actual = receiver.parse(payload, headers);

      // assert
      expect(actual)
          .to.be.an("object");

      expect(actual)
          .to.have.property("format");

      expect(actual.getId())
          .to.equals(id);
    });

    it("Should accept 'extension1'", () => {
      // setup
      var extension1 = "mycuston-ext1"
      var payload = v03.event()
          .type(type)
          .source(source)
          .contenttype(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .data(data)
          .addExtension("extension1", extension1)
          .toString();

      var headers = {
        "content-type":"application/cloudevents+json"
      };

      // act
      var actual = receiver.parse(payload, headers);
      var actualExtensions = actual.getExtensions();

      // assert
      expect(actualExtensions["extension1"])
          .to.equal(extension1);
    });

    it("Should parse 'data' stringfied json to json object", () => {
      // setup
      var payload = v03.event()
          .type(type)
          .source(source)
          .contenttype(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .data(JSON.stringify(data))
          .toString();

      var headers = {
        "content-type":"application/cloudevents+json"
      };

      // act
      var actual = receiver.parse(payload, headers);

      // assert
      expect(actual.getData()).to.deep.equal(data);
    });
  });
});
