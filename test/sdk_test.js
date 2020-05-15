const expect = require("chai").expect;
const { CloudEvent, HTTPReceiver, HTTPEmitter } = require("../");
const SpecV03 = require("../lib/bindings/http/v03").Spec;
const SpecV1 = require("../lib/bindings/http/v1").Spec;
const {
  SPEC_V03,
  SPEC_V1
} = require("../lib/bindings/http/constants.js");

describe("The SDK Requirements", () => {
  it("should expose a CloudEvent type", () => {
    const event = new CloudEvent();
    expect(event instanceof CloudEvent).to.equal(true);
  });

  it("should expose an HTTPReceiver type", () => {
    const receiver = new HTTPReceiver();
    expect(receiver instanceof HTTPReceiver).to.equal(true);
  });

  it("should expose an HTTPEmitter type", () => {
    const emitter = new HTTPEmitter({
      url: "http://example.com"
    });
    expect(emitter instanceof HTTPEmitter).to.equal(true);
  });

  describe("v0.3", () => {
    it("should create an event using the right spec version", () => {
      expect(new CloudEvent(SpecV03).spec.payload.specversion).to.equal(SPEC_V03);
    });
  });

  describe("v1.0", () => {
    it("should create an event using the right spec version", () => {
      expect(new CloudEvent(SpecV1).spec.payload.specversion).to.equal(SPEC_V1);
    });
  });
});
