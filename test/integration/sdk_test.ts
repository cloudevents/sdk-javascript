import "mocha";
import { expect } from "chai";
import { CloudEvent, Emitter, Version } from "../../src";

const fixture = {
  type: "org.cloudevents.test",
  source: "http://cloudevents.io",
};

describe("The SDK Requirements", () => {
  it("should expose a CloudEvent type", () => {
    const event = new CloudEvent(fixture);
    expect(event instanceof CloudEvent).to.equal(true);
  });

  it("should expose an Emitter type", () => {
    const emitter = new Emitter({
      url: "http://example.com",
    });
    expect(emitter instanceof Emitter).to.equal(true);
  });

  describe("v0.3", () => {
    it("should create an event using the right spec version", () => {
      expect(
        new CloudEvent({
          ...fixture,
          specversion: Version.V03,
        }).specversion,
      ).to.equal(Version.V03);
    });
  });

  describe("v1.0", () => {
    it("should create an event using the right spec version", () => {
      expect(new CloudEvent(fixture).specversion).to.equal(Version.V1);
    });
  });
});
