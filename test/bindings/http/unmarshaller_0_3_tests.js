var expect = require("chai").expect;
var Unmarshaller = require("../../../lib/bindings/http/unmarshaller_0_3.js");
var Cloudevent = require("../../../index.js");
var v03 = require("../../../v03/index.js");

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const now = new Date();
const schemaurl = "http://cloudevents.io/schema.json";
const subject = "subject.ext";
const {
  BINARY_HEADERS_03,
  HEADER_CONTENT_TYPE
} = require("../../../lib/bindings/http/constants.js");

const ceContentType = "application/json";

const data = {
  foo: "bar"
};

describe("HTTP Transport Binding Unmarshaller for CloudEvents v0.3", () => {
  it("Throw error when payload is null", () => {
    // setup
    var payload = null;
    var un = new Unmarshaller();

    // act and assert
    return un.unmarshall(payload)
      .then(() => { throw new Error("failed"); })
      .catch((err) =>
        expect(err.message).to.equal("payload is null or undefined"));
  });

  it("Throw error when headers is null", () => {
    // setup
    var payload = {};
    var headers = null;
    var un = new Unmarshaller();

    // act and assert
    return un.unmarshall(payload, headers)
      .then(() => { throw new Error("failed"); })
      .catch((err) =>
        expect(err.message).to.equal("headers is null or undefined"));
  });

  it("Throw error when there is no content-type header", () => {
    // setup
    var payload = {};
    var headers = {};
    var un = new Unmarshaller();

    // act and assert
    un.unmarshall(payload, headers)
      .then(() => { throw new Error("failed"); })
      .catch((err) =>
        expect(err.message).to.equal("content-type header not found"));
  });

  it("Throw error when content-type is not allowed", () => {
    // setup
    var payload = {};
    var headers = {
      "content-type": "text/xml"
    };
    var un = new Unmarshaller();

    // act and assert
    un.unmarshall(payload, headers)
      .then(() => { throw new Error("failed"); })
      .catch((err) =>
        expect(err.message).to.equal("content type not allowed"));
  });

  describe("Structured", () => {
    it("Throw error when has not allowed mime", () => {
      // setup
      var payload = {};
      var headers = {
        "content-type": "application/cloudevents+zip"
      };
      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, headers)
        .then(() => { throw new Error("failed"); })
        .catch((err) =>
          expect(err.message).to.equal("structured+type not allowed"));
    });

    it("Throw error when the event does not follow the spec 0.3", () => {
      // setup
      var payload =
        new v03.CloudEvent(v03.Spec)
          .type(type)
          .source(source)
          .dataContentType(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .data(data)
          .toString();

      var headers = {
        "content-type": "application/cloudevents+json"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, headers)
        .then(() => { throw new Error("failed"); })
        .catch((err) =>
          expect(err.message).to.equal("invalid payload"));
    });

    it("Should accept event that follow the spec 0.3", () => {
      // setup
      var payload =
        new Cloudevent(v03.Spec)
          .type(type)
          .source(source)
          .dataContentType(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .subject(subject)
          .data(data)
          .toString();

      var headers = {
        "content-type": "application/cloudevents+json"
      };

      var un = new Unmarshaller();

      // act and assert
      return un.unmarshall(payload, headers)
        .then((actual) =>
          expect(actual).to.be.an("object"))
        .catch((err) => {
          console.error(err);
          throw err;
        });
    });

    it("Should parse 'data' stringfied json to json object", () => {
      // setup
      var payload =
        new Cloudevent(v03.Spec)
          .type(type)
          .source(source)
          .dataContentType(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .subject(subject)
          .data(JSON.stringify(data))
          .toString();

      var headers = {
        "content-type": "application/cloudevents+json"
      };

      var un = new Unmarshaller();

      // act and assert
      return un.unmarshall(payload, headers)
        .then((actual) => {
          expect(actual.getData()).to.deep.equal(data);
        })
        .catch((err) => {
          console.error(err);
          throw err;
        });
    });
  });

  describe("Binary", () => {
    it("Throw error when has not allowed mime", () => {
      // setup
      var payload = {
        data: "dataString"
      };
      var attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "text/html"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, attributes)
        .then(() => { throw new Error("failed"); })
        .catch((err) =>
          expect(err.message).to.equal("content type not allowed"));
    });

    it("Throw error when the event does not follow the spec 0.3", () => {
      // setup
      var payload = {
        data: "dataString"
      };
      var attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        "CE-CloudEventsVersion": "0.1",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, attributes)
        .then(() => { throw new Error("failed"); })
        .catch((err) =>
          expect(err.message).to.not.empty);
    });

    it("No error when all attributes are in place", () => {
      // setup
      var payload = {
        data: "dataString"
      };
      var attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, attributes)
        .then((actual) => expect(actual).to.be.an("object"));
    });

    it("Throw error when 'ce-datacontentencoding' is not allowed", () => {
      // setup
      var payload = "eyJtdWNoIjoid293In0=";

      var attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json",
        [BINARY_HEADERS_03.CONTENT_ENCONDING]: "binary"
      };

      var un = new Unmarshaller();

      // act and assert
      return un.unmarshall(payload, attributes)
        .then(() => { throw new Error("failed"); })
        .catch((err) => {
          expect(err.message).to.equal("unsupported datacontentencoding");
        });
    });

    it("No error when 'ce-datacontentencoding' is base64", () => {
      // setup
      var payload = "eyJtdWNoIjoid293In0=";
      const expected = {
        much: "wow"
      };

      var attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json",
        [BINARY_HEADERS_03.CONTENT_ENCONDING]: "base64"
      };

      var un = new Unmarshaller();

      // act and assert
      return un.unmarshall(payload, attributes)
        .then((actual) => expect(actual.getData()).to.deep.equal(expected))
        .catch((err) => {
          console.error(err);
          throw err;
        });
    });
  });
});
