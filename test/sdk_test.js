const expect = require("chai").expect;
const { CloudEvent } = require("../");
const SpecV03 = require("../v03").Spec;
const SpecV1 = require("../v1").Spec;

describe("The SDK Requirements", () => {
  describe("v0.3", () => {
    it("should create an event using the right spec version", () => {
      expect(new CloudEvent(SpecV03).spec.payload.specversion).to.equal("0.3");
    });
  });

  describe("v1.0", () => {
    it("should create an event using the right spec version", () => {
      expect(new CloudEvent(SpecV1).spec.payload.specversion).to.equal("1.0");
    });
  });
});
