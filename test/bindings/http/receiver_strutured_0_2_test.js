var expect = require("chai").expect;

var HTTPStructuredReceiver02 =
  require("../../../lib/bindings/http/receiver_structured_0_2.js");

var receiver = new HTTPStructuredReceiver02();

describe("HTTP Transport Binding Structured Receiver 0.2", () => {
  describe("Check", () => {
    it("Throw error when payload arg is null or undefined", () => {
      // setup
      var payload = null;
      var attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("payload is null or undefined");
    });

    it("Throw error when attributes arg is null or undefined", () => {
      // setup
      var payload = {};
      var attributes = null;

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("attributes is null or undefined");
    });

    it("Throw error when payload is not an object", () => {
      // setup
      var payload = "wow";
      var attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("payload must be an object");
    });

    it("Throw error when the content-type is invalid", () => {
      // setup
      var payload = {};
      var attributes = {
        "Content-Type"   : "text/html"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("invalid content type");
    });

    it("No error when all required stuff are in place", () => {
      // setup
      var payload = {};
      var attributes = {
        "Content-Type"   : "application/cloudevents+json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.not.throw();
    });
  });
});
