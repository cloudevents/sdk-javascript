import "mocha";
import { expect } from "chai";

import { CloudEvent, ValidationError, Version, asBase64 } from "../src";
import { StructuredHTTPReceiver } from "../src/transport/http/structured_receiver";

const receiver = new StructuredHTTPReceiver(Version.V1);
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date();
const dataschema = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar",
};

describe("HTTP Transport Binding Structured Receiver for CloudEvents v1.0", () => {
  describe("Check", () => {
    it("Throw error when payload arg is null or undefined", () => {
      // setup
      const payload = null;
      const attributes = {};

      // act and assert
      expect(receiver.parse.bind(receiver, (payload as unknown) as string, attributes)).to.throw(
        ValidationError,
        "payload is null or undefined",
      );
    });

    it("Throw error when attributes arg is null or undefined", () => {
      // setup
      const payload = {};
      const attributes = null;

      expect(receiver.parse.bind(receiver, payload, (attributes as unknown) as string)).to.throw(
        ValidationError,
        "headers is null or undefined",
      );
    });

    it("Throw error when payload is not an object or string", () => {
      // setup
      const payload = 1.0;
      const attributes = {};

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(
        ValidationError,
        "payload must be an object or a string",
      );
    });

    it("Throw error when the content-type is invalid", () => {
      // setup
      const payload = {};
      const attributes = {
        "Content-Type": "text/html",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(ValidationError, "invalid content type");
    });

    it("No error when all required stuff are in place", () => {
      // setup
      const payload = {
        source,
        type,
      };
      const attributes = {
        "Content-Type": "application/cloudevents+json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.not.throw();
    });
  });

  describe("Parse", () => {
    it("Throw error when the event does not follow the spec", () => {
      // setup
      const payload = new CloudEvent({
        type,
        source,
        time,
        data,
      }).toString();

      const headers = {
        "Content-Type": "application/cloudevents+xml",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, headers)).to.throw(ValidationError, "invalid content type");
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
        dataschema,
        dataContentType: ceContentType,
      });
      const headers = {
        "content-type": "application/cloudevents+json",
      };

      // act
      const actual = receiver.parse(payload, headers);

      // assert
      expect(actual).to.be.an.instanceof(CloudEvent);
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
        dataschema,
        dataContentType: ceContentType,
      });
      event["extension1"] = extension1;

      const headers = {
        "content-type": "application/cloudevents+json",
      };

      // act
      const actual = receiver.parse(event, headers);
      expect(actual.extension1).to.equal(extension1);
    });

    it("Should parse 'data' stringified json to json object", () => {
      // setup
      const payload = new CloudEvent({
        type,
        source,
        time,
        dataschema,
        data: data,
        dataContentType: ceContentType,
      });

      const headers = {
        "content-type": "application/cloudevents+json",
      };

      // act
      const actual = receiver.parse(payload, headers);

      // assert
      expect(actual.data).to.deep.equal(data);
    });

    it("Should maps 'data_base64' to 'data' attribute", () => {
      const bindata = Uint32Array.from(JSON.stringify(data), (c) => c.codePointAt(0) as number);
      const expected = asBase64(bindata);
      const payload = {
        type,
        source,
        data: bindata,
        dataContentType: ceContentType,
      };

      const headers = {
        "content-type": "application/cloudevents+json",
      };

      // act
      const actual = receiver.parse(payload, headers);
      expect(actual.data_base64).to.equal(expected);
    });
  });
});
