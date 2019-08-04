var expect = require("chai").expect;

var HTTPBinaryReceiver =
  require("../../../lib/bindings/http/receiver_binary_0_3.js");

var receiver = new HTTPBinaryReceiver();

describe("HTTP Transport Binding Binary Receiver for CloudEvents v0.3", () => {
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

    it("Throw error when payload is not an object or string", () => {
      // setup
      var payload = 1.2;
      var attributes = {};

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("payload must be an object or a string");
    });

    it("Throw error when headers has no 'ce-type'", () => {
      // setup
      var payload = {};
      var attributes = {
        "ce-specversion" : "specversion",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "Content-Type"   : "application/json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("header 'ce-type' not found");
    });

    it("Throw error when headers has no 'ce-specversion'", () => {
      // setup
      var payload = {};
      var attributes = {
        "ce-type"        : "type",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "Content-Type"   : "application/json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("header 'ce-specversion' not found");
    });

    it("Throw error when headers has no 'ce-source'", () => {
      // setup
      var payload = {};
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "specversion",
        "ce-id"          : "id",
        "Content-Type"   : "application/json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("header 'ce-source' not found");
    });

    it("Throw error when headers has no 'ce-id'", () => {
      // setup
      var payload = {};
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "specversion",
        "ce-source"      : "source",
        "Content-Type"   : "application/json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("header 'ce-id' not found");
    });

    it("Throw error when spec is not 0.3", () => {
      // setup
      var payload = {};
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.2",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "Content-Type"   : "application/json"
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes))
        .to.throw("invalid spec version");
    });

    it("Throw error when the content-type is invalid", () => {
      // setup
      var payload = {};
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "specversion",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "Content-Type"   : "text/html"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.throw("invalid content type");
    });

    it("No error when all required headers are in place", () => {
      // setup
      var payload = {};
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "Content-Type"   : "application/json"
      };

      // act and assert
      expect(receiver.check.bind(receiver, payload, attributes))
        .to.not.throw();
    });
  });

  describe("Parse", () => {
    it("Cloudevent contains 'type'", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getType())
        .to.equal("type");
    });

    it("Cloudevent contains 'specversion'", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getSpecversion())
        .to.equal("0.3");
    });

    it("Cloudevent contains 'source'", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getSource())
        .to.equal("/source");
    });

    it("Cloudevent contains 'id'", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getId())
        .to.equal("id");
    });

    it("Cloudevent contains 'time'", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00.000Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getTime())
        .to.equal("2019-06-16T11:42:00.000Z");
    });

    it("Cloudevent contains 'schemaurl'", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getSchemaurl())
        .to.equal("http://schema.registry/v1");
    });

    it("Cloudevent contains 'contenttype' (application/json)", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getContenttype())
        .to.equal("application/json");
    });

    it("Cloudevent contains 'contenttype' (application/octet-stream)", () => {
      // setup
      var payload = "The payload is binary data";
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/octet-stream"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getContenttype())
        .to.equal("application/octet-stream");
    });

    it("Cloudevent contains 'data' (application/json)", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getData())
        .to.deep.equal(payload);
    });

    it("Cloudevent contains 'data' (application/octet-stream)", () => {
      // setup
      var payload = "The payload is binary data";
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "/source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/octet-stream"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.getData())
        .to.deep.equal(payload);
    });

    it("No error when all attributes are in place", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      // act
      var actual = receiver.parse(payload, attributes);

      // assert
      expect(actual)
          .to.be.an("object");

      expect(actual)
          .to.have.property("format");
    });

    it("Should accept 'extension1'", () => {
      // setup
      var extension1 = "mycuston-ext1";
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.3",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json",
        "ce-extension1"  : extension1
      };

      // act
      var actual = receiver.parse(payload, attributes);
      var actualExtensions = actual.getExtensions();

      // assert
      expect(actualExtensions["extension1"])
          .to.equal(extension1);
    });
  });
});
