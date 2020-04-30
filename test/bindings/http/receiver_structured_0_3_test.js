const expect = require("chai").expect;
const v03 = require("../../../v03/index.js");

const HTTPStructuredReceiver =
  require("../../../lib/bindings/http/receiver_structured_0_3.js");

const receiver = new HTTPStructuredReceiver();

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const now = new Date();
const schemaurl = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

describe("HTTP Transport Binding Structured Receiver CloudEvents v0.3", () => {
  describe("Check", () => {
    it("Throw error when payload arg is null or undefined", () => {
      // setup
      const payload = null;
      const attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("payload is null or undefined");
    });

    it("Throw error when attributes arg is null or undefined", () => {
      // setup
      const payload = {};
      const attributes = null;

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("attributes is null or undefined");
    });

    it("Throw error when payload is not an object or string", () => {
      // setup
      const payload = 1.0;
      const attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("payload must be an object or string");
    });

    it("Throw error when the content-type is invalid", () => {
      // setup
      const payload = {};
      const attributes = {
        "Content-Type": "text/html"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("invalid content type");
    });

    it("Throw error data content encoding is base64, but 'data' is not",
      () => {
        // setup
        const payload = v03.event()
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

        const attributes = {
          "Content-Type": "application/cloudevents+json"
        };

        // act and assert
        expect(receiver.parse.bind(receiver, payload, attributes))
          .to.throw("invalid payload");
      });

    it("No error when all required stuff are in place", () => {
      // setup
      const payload = {};
      const attributes = {
        "Content-Type": "application/cloudevents+json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.not.throw();
    });
  });

  describe("Parse", () => {
    it("Throw error when the event does not follow the spec", () => {
      // setup
      const payload = {};
      const attributes = {
        "Content-Type": "application/cloudevents+json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.not.throw();
    });
  });

  describe("Parse", () => {
    it("Throw error when the event does not follow the spec", () => {
      // setup
      const payload =
        v03.event()
          .type(type)
          .source(source)
          .time(now)
          .schemaurl(schemaurl)
          .data(data)
          .toString();

      const headers = {
        "Content-Type": "application/cloudevents+xml"
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, headers))
        .to.throw("invalid content type");
    });

    it("Should accept event that follows the spec", () => {
      // setup
      const id = "id-x0dk";
      const payload = v03.event()
        .type(type)
        .source(source)
        .id(id)
        .dataContentType(ceContentType)
        .time(now)
        .schemaurl(schemaurl)
        .data(data)
        .toString();
      const headers = {
        "content-type": "application/cloudevents+json"
      };

      // act
      const actual = receiver.parse(payload, headers);

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
      const extension1 = "mycuston-ext1";
      const payload = v03.event()
        .type(type)
        .source(source)
        .dataContentType(ceContentType)
        .time(now)
        .schemaurl(schemaurl)
        .data(data)
        .addExtension("extension1", extension1)
        .toString();

      const headers = {
        "content-type": "application/cloudevents+json"
      };

      // act
      const actual = receiver.parse(payload, headers);
      const actualExtensions = actual.getExtensions();

      // assert
      expect(actualExtensions.extension1)
        .to.equal(extension1);
    });

    it("Should parse 'data' stringfied json to json object", () => {
      // setup
      const payload = v03.event()
        .type(type)
        .source(source)
        .dataContentType(ceContentType)
        .time(now)
        .schemaurl(schemaurl)
        .data(JSON.stringify(data))
        .toString();

      const headers = {
        "content-type": "application/cloudevents+json"
      };

      // act
      const actual = receiver.parse(payload, headers);

      // assert
      expect(actual.getData()).to.deep.equal(data);
    });
  });
});
