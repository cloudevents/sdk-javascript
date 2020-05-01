const expect = require("chai").expect;
const v1 = require("../v1/index.js");

describe("The SDK Requirements", () => {
  describe("v1.0", () => {
    it("should create an event using the right spec version", () => {
      expect(v1.event().spec.payload.specversion).to.equal("1.0");
    });

    it("should exports 'Spec'", () => {
      expect(v1).to.have.property("Spec");
    });

    it("should exports 'StructuredHTTPEmitter'", () => {
      expect(v1).to.have.property("StructuredHTTPEmitter");
    });

    it("should exports 'StructuredHTTPReceiver'", () => {
      expect(v1).to.have.property("StructuredHTTPReceiver");
    });

    it("should exports 'BinaryHTTPEmitter'", () => {
      expect(v1).to.have.property("BinaryHTTPEmitter");
    });

    it("should exports 'BinaryHTTPReceiver'", () => {
      expect(v1).to.have.property("BinaryHTTPReceiver");
    });

    it("should exports 'event'", () => {
      expect(v1).to.have.property("event");
    });
  });
});
