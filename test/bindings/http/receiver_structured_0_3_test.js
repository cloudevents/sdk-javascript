const expect = require("chai").expect;
const ValidationError = require("../../../lib/bindings/http/validation/validation_error.js");
const HTTPStructuredReceiver = require("../../../lib/bindings/http/receiver_structured.js");
const CloudEvent = require("../../../lib/cloudevent.js");
const { SPEC_V03 } = require("../../../lib/bindings/http/constants.js");

const receiver = new HTTPStructuredReceiver(SPEC_V03);

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date();
const schemaURL = "http://cloudevents.io/schema.json";

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
        .to.throw(ValidationError, "payload is null or undefined");
    });

    it("Throw error when attributes arg is null or undefined", () => {
      // setup
      const payload = {};
      const attributes = null;

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw(ValidationError, "attributes is null or undefined");
    });

    it("Throw error when payload is not an object or string", () => {
      // setup
      const payload = 1.0;
      const attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw(ValidationError, "payload must be an object or a string");
    });

    it("Throw error when the content-type is invalid", () => {
      // setup
      const payload = {};
      const attributes = {
        "Content-Type": "text/html"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw(ValidationError, "invalid content type");
    });

    it("Throw error data content encoding is base64, but 'data' is not",
      () => {
        // setup
        const event = new CloudEvent({
          specversion: SPEC_V03,
          type,
          source,
          time,
          dataContentType: "text/plain",
          dataContentEncoding: "base64",
          schemaURL,
          data: "No base 64 value"
        });
        event.addExtension(ext1Name, ext1Value);
        event.addExtension(ext2Name, ext2Value);
        const payload = event.toString();

        const attributes = {
          "Content-Type": "application/cloudevents+json"
        };

        // act and assert
        expect(receiver.parse.bind(receiver, payload, attributes))
          .to.throw(ValidationError, "invalid payload");
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
      const payload = {
        type,
        source,
        time,
        schemaURL,
        data
      };

      const headers = {
        "Content-Type": "application/cloudevents+xml"
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, headers))
        .to.throw(ValidationError, "invalid content type");
    });

    it("Should accept event that follows the spec", () => {
      // setup
      const id = "id-x0dk";
      const payload = {
        id,
        type,
        source,
        time,
        schemaURL,
        dataContentType: ceContentType,
        data
      };
      const headers = {
        "content-type": "application/cloudevents+json"
      };

      // act
      const actual = receiver.parse(payload, headers);

      // assert
      expect(actual).to.be.an.instanceof(CloudEvent);

      expect(actual).to.have.property("format");

      expect(actual.id).to.equal(id);
    });

    it("Should accept 'extension1'", () => {
      // setup
      const extension1 = "mycuston-ext1";
      const payload = {
        type,
        source,
        time,
        schemaURL,
        data,
        dataContentType: ceContentType,
        "extension1": extension1
      };
      const headers = {
        "content-type": "application/cloudevents+json"
      };

      // act
      const actual = receiver.parse(payload, headers);
      const actualExtensions = actual.getExtensions();

      // assert
      expect(actualExtensions.extension1).to.equal(extension1);
    });

    it("Should parse 'data' stringfied json to json object", () => {
      const payload = new CloudEvent({
        specversion: SPEC_V03,
        type,
        source,
        time,
        schemaURL,
        dataContentType: ceContentType,
        data: JSON.stringify(data)
      }).toString();
      const headers = {
        "content-type": "application/cloudevents+json"
      };

      // act
      const actual = receiver.parse(payload, headers);

      // assert
      expect(actual.data).to.deep.equal(data);
    });
  });
});
