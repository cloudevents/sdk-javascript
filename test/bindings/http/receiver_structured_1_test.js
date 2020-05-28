const expect = require("chai").expect;
const { Spec } = require("../../../lib/bindings/http/v1/index.js");
const { CloudEvent } = require("../../..//index.js");
const { asBase64 } = require("../../../lib/bindings/http/validation/fun.js");
const { SPEC_V1 } = require("../../../lib/bindings/http/constants.js");
const ValidationError = require("../../../lib/bindings/http/validation/validation_error.js");
const HTTPStructuredReceiver = require("../../../lib/bindings/http/receiver_structured.js");

const receiver = new HTTPStructuredReceiver(SPEC_V1);

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resource/123";
const time = new Date();
const dataSchema = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};

describe("HTTP Transport Binding Structured Receiver for CloudEvents v1.0",
  () => {
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
        const payload = new CloudEvent({
          type,
          source,
          time,
          data
        }).toString();

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
        const payload = new CloudEvent({
          id,
          type,
          source,
          time,
          data,
          dataSchema,
          dataContentType: ceContentType,
        }).toString();
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
        const extension1 = "mycustom-ext1";
        const event = new CloudEvent({
          type,
          source,
          time,
          data,
          dataSchema,
          dataContentType: ceContentType
        });
        event.addExtension("extension1", extension1);
        const payload = event.toString();

        const headers = {
          "content-type": "application/cloudevents+json"
        };

        // act
        const actual = receiver.parse(payload, headers);
        const actualExtensions = actual.getExtensions();

        // assert
        expect(actualExtensions.extension1).to.equal(extension1);
      });

      it("Should parse 'data' stringified json to json object", () => {
      // setup
        const payload = new CloudEvent({
          type,
          source,
          time,
          dataSchema,
          data: JSON.stringify(data),
          dataContentType: ceContentType
        }).toString();

        const headers = {
          "content-type": "application/cloudevents+json"
        };

        // act
        const actual = receiver.parse(payload, headers);

        // assert
        expect(actual.data).to.deep.equal(data);
      });

      it("Should maps 'data_base64' to 'data' attribute", () => {
      // setup
        const bindata = Uint32Array.from(JSON.stringify(data), (c) => c.codePointAt(0));
        const expected = asBase64(bindata);
        const payload = new CloudEvent({
          type,
          source,
          data: bindata,
          dataContentType: ceContentType
        }).format();

        const headers = {
          "content-type": "application/cloudevents+json"
        };

        // act
        const actual = receiver.parse(JSON.stringify(payload), headers);

        // assert
        expect(actual.data).to.equal(expected);
      });
    });
  });
