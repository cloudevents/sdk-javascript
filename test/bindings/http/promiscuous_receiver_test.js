const { expect } = require("chai");
const { CloudEvent, HTTPReceiver } = require("../../../index.js");
const constants = require("../../../lib/bindings/http/constants.js");

const receiver = new HTTPReceiver();
const id = "1234";
const type = "org.cncf.cloudevents.test";
const source = "urn:event:from:myapi/resourse/123";
const data = {
  lunch: "sushi"
};

describe("HTTP Transport Binding Receiver for CloudEvents", () => {
  describe("V1", () => {
    const specversion = "1.0";

    it("Structured data returns a CloudEvent", () => {
      const payload = {
        id,
        type,
        source,
        data,
        specversion
      };

      const headers = {
        "Content-Type": "application/cloudevents+json"
      };

      const event = receiver.accept(headers, payload);
      validateEvent(event, specversion);
    });

    it("Binary data returns a CloudEvent", () => {
      const headers = {
        "Content-Type": constants.DEFAULT_CONTENT_TYPE,
        [constants.DEFAULT_SPEC_VERSION_HEADER]: specversion,
        [constants.BINARY_HEADERS_1.ID]: id,
        [constants.BINARY_HEADERS_1.TYPE]: type,
        [constants.BINARY_HEADERS_1.SOURCE]: source
      };

      const event = receiver.accept(headers, data);
      validateEvent(event, specversion);
    });
  });

  describe("V03", () => {
    const specversion = "0.3";

    it("Structured data returns a CloudEvent", () => {
      const payload = {
        id,
        type,
        source,
        data,
        specversion
      };

      const headers = {
        "Content-Type": "application/cloudevents+json"
      };

      const event = receiver.accept(headers, payload);
      validateEvent(event, specversion);
    });

    it("Binary data returns a CloudEvent", () => {
      const headers = {
        "Content-Type": constants.DEFAULT_CONTENT_TYPE,
        [constants.DEFAULT_SPEC_VERSION_HEADER]: specversion,
        [constants.BINARY_HEADERS_03.ID]: id,
        [constants.BINARY_HEADERS_03.TYPE]: type,
        [constants.BINARY_HEADERS_03.SOURCE]: source
      };

      const event = receiver.accept(headers, data);
      validateEvent(event, specversion);
    });
  });
});

function validateEvent(event, specversion) {
  expect(event instanceof CloudEvent).to.equal(true);
  expect(event.getId()).to.equal(id);
  expect(event.getType()).to.equal(type);
  expect(event.getSource()).to.equal(source);
  expect(event.getData()).to.deep.equal(data);
  expect(event.getSpecversion()).to.equal(specversion);
}
