import "mocha";
import { expect } from "chai";
import { CloudEvent, Receiver, ValidationError } from "../../src";
import { CloudEventV1 } from "../../src/event/v1";

const id = "1234";
const type = "org.cncf.cloudevents.test";
const source = "urn:event:from:myapi/resourse/123";
const structuredHeaders = { "content-type": "application/cloudevents+json" };
const data = { lunch: "sushi" };

describe("HTTP Transport Binding Receiver for CloudEvents", () => {
  describe("HTTP CloudEvent format detection", () => {
    const specversion = "1.0";
    it("Throws when the event format cannot be detected", () => {
      const payload = {
        id,
        type,
        source,
        data,
        specversion,
      };

      expect(Receiver.accept.bind(Receiver, {}, payload)).to.throw(ValidationError, "no cloud event detected");
    });

    it("Converts the JSON body of a binary event to an Object", () => {
      const binaryHeaders = {
        "content-type": "application/json; charset=utf-8",
        "ce-specversion": specversion,
        "ce-id": id,
        "ce-type": type,
        "ce-source": source,
      };

      const event: CloudEvent = Receiver.accept(binaryHeaders, data);
      expect(typeof event.data).to.equal("object");
      expect((event.data as Record<string, string>).lunch).to.equal("sushi");
    });

    it("Accepts binary events when the data property is undefined", () => {
      const binaryHeaders = {
        "content-type": "application/json; charset=utf-8",
        "ce-specversion": specversion,
        "ce-id": id,
        "ce-type": type,
        "ce-source": source,
      };
      const event = Receiver.accept(binaryHeaders, undefined);
      expect(event.data).to.be.undefined;
    });

    it("Accepts binary events when the data property is null", () => {
      const binaryHeaders = {
        "content-type": "application/json; charset=utf-8",
        "ce-specversion": specversion,
        "ce-id": id,
        "ce-type": type,
        "ce-source": source,
      };
      const event = Receiver.accept(binaryHeaders, null);
      expect(event.data).to.be.undefined;
    });

    it("Converts the JSON body of a structured event to an Object", () => {
      const payload = {
        id,
        type,
        source,
        data,
        specversion,
      };

      const event = Receiver.accept(structuredHeaders, payload);
      expect(typeof event.data).to.equal("object");
      expect((event.data as Record<string, string>).lunch).to.equal("sushi");
    });

    it("Recognizes headers in title case for binary events", () => {
      const binaryHeaders = {
        "Content-Type": "application/json; charset=utf-8",
        "ce-specversion": specversion,
        "ce-id": id,
        "ce-type": type,
        "ce-source": source,
      };

      const event: CloudEvent = Receiver.accept(binaryHeaders, data);
      expect(event.validate()).to.be.true;
      expect((event.data as Record<string, string>).lunch).to.equal("sushi");
    });

    it("Recognizes headers in title case for structured events", () => {
      const structuredHeaders = { "Content-Type": "application/cloudevents+json" };
      const payload = {
        id,
        type,
        source,
        data,
        specversion,
      };

      const event: CloudEvent = Receiver.accept(structuredHeaders, payload);
      expect(event.validate()).to.be.true;
      expect((event.data as Record<string, string>).lunch).to.equal("sushi");
    });
  });

  describe("V1", () => {
    const specversion = "1.0";

    it("Structured data returns a CloudEvent", () => {
      const payload = {
        id,
        type,
        source,
        data,
        specversion,
      };

      const event = Receiver.accept(structuredHeaders, payload);
      validateEvent(event, specversion);
    });

    it("Binary data returns a CloudEvent", () => {
      const binaryHeaders = {
        "content-type": "application/json; charset=utf-8",
        "ce-specversion": specversion,
        "ce-id": id,
        "ce-type": type,
        "ce-source": source,
      };

      const event = Receiver.accept(binaryHeaders, data);
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
        specversion,
      };

      const event = Receiver.accept(structuredHeaders, payload);
      validateEvent(event, specversion);
    });

    it("Binary data returns a CloudEvent", () => {
      const binaryHeaders = {
        "content-type": "application/json; charset=utf-8",
        "ce-specversion": specversion,
        "ce-id": id,
        "ce-type": type,
        "ce-source": source,
      };

      const event = Receiver.accept(binaryHeaders, data);
      validateEvent(event, specversion);
    });
  });

  describe("Kafka-Knative event source", () => {
    const specversion = "1.0";
    const id = "partition:1/offset:23";
    const type = "dev.knative.kafka.event";
    const source = "/apis/v1/namespaces/kafka/kafkasources/kafka-source#knative-demo-topic";

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
        "x-request-id": "d3649c1b-a968-40bf-a9da-3e853abc0c8b",
      };
      const event = Receiver.accept(headers, data);
      expect(event instanceof CloudEvent).to.equal(true);
      expect(event.id).to.equal(id);
      expect(event.type).to.equal(type);
      expect(event.source).to.equal(source);
      expect(event.data).to.deep.equal(data);
      expect(event.specversion).to.equal(specversion);
    });
  });
});

function validateEvent(event: CloudEventV1, specversion: string) {
  expect(event instanceof CloudEvent).to.equal(true);
  expect(event.id).to.equal(id);
  expect(event.type).to.equal(type);
  expect(event.source).to.equal(source);
  expect(event.data).to.deep.equal(data);
  expect(event.specversion).to.equal(specversion);
}
