const expect = require("chai").expect;
const { Spec } = require("../../../v1/index.js");
const { CloudEvent } = require("../../../index.js");
const { asBase64 } = require("../../../lib/utils/fun.js");
const ValidationError = require("../../../lib/validation_error.js");
const HTTPStructuredReceiver = require("../../../lib/bindings/http/receiver_structured_1.js");

const receiver = new HTTPStructuredReceiver();

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resource/123";
const now = new Date();
const dataschema = "http://cloudevents.io/schema.json";

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
          .to.throw(ValidationError, "payload must be an object or string");
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
        const payload =
        new CloudEvent()
          .type(type)
          .source(source)
          .time(now)
          .data(data)
          .toString();

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
        const payload = new CloudEvent(Spec)
          .type(type)
          .source(source)
          .id(id)
          .dataContentType(ceContentType)
          .time(now)
          .dataschema(dataschema)
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
        const extension1 = "mycustom-ext1";
        const payload = new CloudEvent(Spec)
          .type(type)
          .source(source)
          .dataContentType(ceContentType)
          .time(now)
          .dataschema(dataschema)
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

      it("Should parse 'data' stringified json to json object", () => {
      // setup
        const payload = new CloudEvent(Spec)
          .type(type)
          .source(source)
          .dataContentType(ceContentType)
          .time(now)
          .dataschema(dataschema)
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

      it("Should maps 'data_base64' to 'data' attribute", () => {
      // setup
        const bindata = Uint32Array
          .from(JSON.stringify(data), (c) => c.codePointAt(0));
        const expected = asBase64(bindata);
        const payload = new CloudEvent(Spec)
          .type(type)
          .source(source)
          .dataContentType(ceContentType)
          .data(bindata)
          .format();

        const headers = {
          "content-type": "application/cloudevents+json"
        };

        // act
        const actual = receiver.parse(JSON.stringify(payload), headers);

        // assert
        expect(actual.getData()).to.equal(expected);
      });
    });
  });
