const { expect } = require("chai");
const { CloudEvent, HTTPReceiver } = require("../../../index.js");
const {
  HEADER_CONTENT_TYPE,
  DEFAULT_CONTENT_TYPE,
  MIME_CE_JSON,
  DEFAULT_SPEC_VERSION_HEADER,
  BINARY_HEADERS_03,
  BINARY_HEADERS_1
} = require("../../../lib/bindings/http/constants.js");

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
        [HEADER_CONTENT_TYPE]: MIME_CE_JSON
      };

      const event = receiver.accept(headers, payload);
      validateEvent(event, specversion);
    });

    it("Binary data returns a CloudEvent", () => {
      const headers = {
        [HEADER_CONTENT_TYPE]: DEFAULT_CONTENT_TYPE,
        [DEFAULT_SPEC_VERSION_HEADER]: specversion,
        [BINARY_HEADERS_1.ID]: id,
        [BINARY_HEADERS_1.TYPE]: type,
        [BINARY_HEADERS_1.SOURCE]: source
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
        [HEADER_CONTENT_TYPE]: MIME_CE_JSON
      };

      const event = receiver.accept(headers, payload);
      validateEvent(event, specversion);
    });

    it("Binary data returns a CloudEvent", () => {
      const headers = {
        [HEADER_CONTENT_TYPE]: DEFAULT_CONTENT_TYPE,
        [DEFAULT_SPEC_VERSION_HEADER]: specversion,
        [BINARY_HEADERS_03.ID]: id,
        [BINARY_HEADERS_03.TYPE]: type,
        [BINARY_HEADERS_03.SOURCE]: source
      };

      const event = receiver.accept(headers, data);
      validateEvent(event, specversion);
    });
  });

  describe("Kafka-Knative event source", () => {
    const specversion = "1.0";
    const id = "partition:1/offset:23";
    const type = "dev.knative.kafka.event";
    const source =
      "/apis/v1/namespaces/kafka/kafkasources/kafka-source#knative-demo-topic";

    it("Should be parsable", () => {
      const headers = {
        host: "event-display.kafka.svc.cluster.local",
        "user-agent": "Go-http-client/1.1",
        "content-length": "59",
        "accept-encoding": "gzip",
        "ce-id": id,
        "ce-source": source,
        "ce-specversion": "1.0",
        "ce-subject": "partition:1#23",
        "ce-time": "2020-05-07T14:16:30.245Z",
        "ce-type": type,
        forwarded: "for=10.131.0.72;proto=http",
        "k-proxy-request": "activator",
        "x-envoy-expected-rq-timeout-ms": "600000",
        "x-forwarded-for": "10.131.0.72, 10.128.2.99",
        "x-forwarded-proto": "http",
        "x-request-id": "d3649c1b-a968-40bf-a9da-3e853abc0c8b"
      };
      const event = receiver.accept(headers, data);
      expect(event instanceof CloudEvent).to.equal(true);
      expect(event.getId()).to.equal(id);
      expect(event.getType()).to.equal(type);
      expect(event.getSource()).to.equal(source);
      expect(event.getData()).to.deep.equal(data);
      expect(event.getSpecversion()).to.equal(specversion);
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
