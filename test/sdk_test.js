const expect = require("chai").expect;
const v02 = require("../v02/index.js");
const v03 = require("../v03/index.js");
const v1 = require("../v1/index.js");

describe("The SDK Requirements", () => {
  describe("v0.2", () => {
    it("should create an event using the right spec version", () => {
      expect(v02.event().spec.payload.specversion).to.equal("0.2");
    });

    it("should exports 'Spec'", () => {
      expect(v02).to.have.property("Spec");
    });

    it("should exports 'StructuredHTTPEmitter'", () => {
      expect(v02).to.have.property("StructuredHTTPEmitter");
    });

    it("should exports 'StructuredHTTPReceiver'", () => {
      expect(v02).to.have.property("StructuredHTTPReceiver");
    });

    it("should exports 'BinaryHTTPEmitter'", () => {
      expect(v02).to.have.property("BinaryHTTPEmitter");
    });

    it("should exports 'BinaryHTTPReceiver'", () => {
      expect(v02).to.have.property("BinaryHTTPReceiver");
    });

    it("should exports 'HTTPUnmarshaller'", () => {
      expect(v02).to.have.property("HTTPUnmarshaller");
    });

    it("should exports 'event'", () => {
      expect(v02).to.have.property("event");
    });
  });

  describe("v0.3", () => {
    it("should create an event using the right spec version", () => {
      expect(v03.event().spec.payload.specversion).to.equal("0.3");
    });

    it("should exports 'Spec'", () => {
      expect(v03).to.have.property("Spec");
    });

    it("should exports 'StructuredHTTPEmitter'", () => {
      expect(v03).to.have.property("StructuredHTTPEmitter");
    });

    it("should exports 'StructuredHTTPReceiver'", () => {
      expect(v03).to.have.property("StructuredHTTPReceiver");
    });

    it("should exports 'BinaryHTTPEmitter'", () => {
      expect(v03).to.have.property("BinaryHTTPEmitter");
    });

    it("should exports 'BinaryHTTPReceiver'", () => {
      expect(v03).to.have.property("BinaryHTTPReceiver");
    });

    it("should exports 'HTTPUnmarshaller'", () => {
      expect(v03).to.have.property("HTTPUnmarshaller");
    });

    it("should exports 'event'", () => {
      expect(v03).to.have.property("event");
    });
  });

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
