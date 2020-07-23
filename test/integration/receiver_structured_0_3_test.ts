import "mocha";
import { expect } from "chai";

import { CloudEvent, ValidationError, Version } from "../../src";
import { StructuredHTTPReceiver } from "../../src/transport/http/structured_receiver";

const receiver = new StructuredHTTPReceiver(Version.V03);
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date();
const schemaurl = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar",
};

describe("HTTP Transport Binding Structured Receiver CloudEvents v0.3", () => {
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

    it("Throw error data content encoding is base64, but 'data' is not", () => {
      // setup
      const event = {
        specversion: Version.V03,
        type,
        source,
        time,
        datacontenttype: "text/plain",
        datacontentencoding: "base64",
        schemaurl,
        data: "No base 64 value",
      };

      const attributes = {
        "Content-Type": "application/cloudevents+json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, event, attributes)).to.throw(ValidationError, "invalid payload");
    });

    it("No error when all required stuff are in place", () => {
      // setup
      const payload = {
        specversion: Version.V03,
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
      const payload = {};
      const attributes = {
        "Content-Type": "application/cloudevents+json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw();
    });
  });

  describe("Parse", () => {
    it("Throw error when the event does not follow the spec", () => {
      const payload = {
        type,
        source,
        time,
        schemaurl,
        data,
      };

      const headers = {
        "Content-Type": "application/cloudevents+xml",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, headers)).to.throw(ValidationError, "invalid content type");
    });

    it("Should accept event that follows the spec", () => {
      // setup
      const id = "id-x0dk";
      const payload = {
        specversion: Version.V03,
        id,
        type,
        source,
        time,
        schemaurl,
        datacontenttype: ceContentType,
        data,
      };
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
      const extension1 = "mycuston-ext1";
      const payload = {
        specversion: Version.V03,
        type,
        source,
        time,
        schemaurl,
        data,
        datacontenttype: ceContentType,
        extension1: extension1,
      };
      const headers = {
        "content-type": "application/cloudevents+json",
      };

      // act
      const actual = receiver.parse(payload, headers);

      // assert
      expect(actual.extension1).to.equal(extension1);
    });

    it("Should parse 'data' stringfied json to json object", () => {
      const payload = {
        specversion: Version.V03,
        type,
        source,
        time,
        schemaurl,
        datacontenttype: ceContentType,
        data: JSON.stringify(data),
      };
      const headers = {
        "content-type": "application/cloudevents+json",
      };

      // act
      const actual = receiver.parse(payload, headers);

      // assert
      expect(actual.data).to.deep.equal(data);
    });
  });
});
