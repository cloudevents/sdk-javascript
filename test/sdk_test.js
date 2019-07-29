const expect = require("chai").expect;
const v02 = require("../v02/index.js");
const v03 = require("../v03/index.js");

describe("The SDK Requirements", () => {
  describe("v0.2", () => {
    it("should create an event using the right spec version", () => {
      expect(v02.event().spec.payload.specversion).to.equal("0.2");
    });

    it("should have 'Spec' export", () => {
      expect(v02).to.have.property("Spec");
    });

    it("should have 'StructuredHTTPEmitter' export", () => {
      expect(v02).to.have.property("StructuredHTTPEmitter");
    });

    it("should have 'BinaryHTTPEmitter' export", () => {
      expect(v02).to.have.property("BinaryHTTPEmitter");
    });

    it("should have 'event' export", () => {
      expect(v02).to.have.property("event");
    });
  });

  describe("v0.3", () => {
    it("should create an event using the right spec version", () => {
      expect(v03.event().spec.payload.specversion).to.equal("0.3");
    });
  });
});
