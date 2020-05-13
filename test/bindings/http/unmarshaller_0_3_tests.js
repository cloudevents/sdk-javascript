const expect = require("chai").expect;
const ValidationError = require("../../../lib/validation_error.js");
const Unmarshaller = require("../../../lib/bindings/http/unmarshaller_0_3.js");
const { CloudEvent } = require("../../../index.js");
const v03 = require("../../../v03/index.js");

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

const un = new Unmarshaller();

describe("HTTP Transport Binding Unmarshaller for CloudEvents v0.3", () => {
  it("Throw error when payload is null", () => {
    expect(() => un.unmarshall(null)).to.throw(ValidationError, "payload is null or undefined");
  });

  it("Throw error when headers is null", () => {
    expect(() => un.unmarshall({})).to.throw(ValidationError, "headers is null or undefined");
    expect(() => un.unmarshall({}, null)).to
      .throw(ValidationError, "headers is null or undefined");
  });

  it("Throw error when there is no content-type header", () => {
    expect(() => un.unmarshall({}, {})).to
      .throw(ValidationError, "content-type header not found");
  });

  it("Throw error when content-type is not allowed", () => {
    const headers = {
      "content-type": "text/xml"
    };
    expect(() => un.unmarshall({}, headers)).to
      .throw(ValidationError, "content type not allowed");
  });

  describe("Structured", () => {
    it("Throw error when has not allowed mime", () => {
      // setup
      const headers = {
        "content-type": "application/cloudevents+zip"
      };

      // act and assert
      expect(() => un.unmarshall({}, headers)).to
        .throw(ValidationError, "structured+type not allowed");
    });

    it("Throw error when the event does not follow the spec 0.3", () => {
      const payload =
        new CloudEvent(v03.Spec)
          .time(now)
          .toString();

      const headers = {
        "content-type": "application/cloudevents+json"
      };

      expect(() => un.unmarshall(payload, headers)).to.throw(ValidationError);
    });

    it("Should accept event TypeErrorthat follow the spec 0.3", () => {
      const payload =
        new CloudEvent(v03.Spec)
          .type(type)
          .data(data)
          .source(source)
          .dataContentType(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .subject(subject)
          .format();

      const headers = {
        "content-type": "application/cloudevents+json"
      };
      const event = un.unmarshall(payload, headers);
      expect(event instanceof CloudEvent).to.equal(true);
    });

    it("Should parse 'data' stringfied json to json object", () => {
      // setup
      const payload =
        new CloudEvent(v03.Spec)
          .type(type)
          .source(source)
          .dataContentType(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .subject(subject)
          .data(JSON.stringify(data))
          .toString();

      const headers = {
        "content-type": "application/cloudevents+json"
      };

      const event = un.unmarshall(payload, headers);
      expect(event.getData()).to.deep.equal(data);
    });
  });

  describe("Binary", () => {
    it("Throw error when has not allowed mime", () => {
      // setup
      const payload = {
        data: "dataString"
      };
      const attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "text/html"
      };

      expect(() => un.unmarshall(payload, attributes)).to
        .throw(ValidationError, "content type not allowed");
    });

    it("Throw error when the event does not follow the spec 0.3", () => {
      // setup
      const payload = {
        data: "dataString"
      };
      const attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        "CE-CloudEventsVersion": "0.1",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json"
      };

      expect(() => un.unmarshall(payload, attributes)).to
        .throw(ValidationError, "header 'ce-specversion' not found");
    });

    it("No error when all attributes are in place", () => {
      // setup
      const payload = {
        data: "dataString"
      };
      const attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json"
      };

      const event = un.unmarshall(payload, attributes);
      expect(event instanceof CloudEvent).to.equal(true);
    });

    it("Throw error when 'ce-datacontentencoding' is not allowed", () => {
      // setup
      const payload = "eyJtdWNoIjoid293In0=";

      const attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json",
        [BINARY_HEADERS_03.CONTENT_ENCONDING]: "binary"
      };

      expect(() => un.unmarshall(payload, attributes)).to
        .throw(ValidationError, "unsupported datacontentencoding");
    });

    it("No error when 'ce-datacontentencoding' is base64", () => {
      // setup
      const payload = "eyJtdWNoIjoid293In0=";
      const expected = {
        much: "wow"
      };

      const attributes = {
        [BINARY_HEADERS_03.TYPE]: "type",
        [BINARY_HEADERS_03.SPEC_VERSION]: "0.3",
        [BINARY_HEADERS_03.SOURCE]: "source",
        [BINARY_HEADERS_03.ID]: "id",
        [BINARY_HEADERS_03.TIME]: "2019-06-16T11:42:00Z",
        [BINARY_HEADERS_03.SCHEMA_URL]: "http://schema.registry/v1",
        [HEADER_CONTENT_TYPE]: "application/json",
        [BINARY_HEADERS_03.CONTENT_ENCONDING]: "base64"
      };

      const event = un.unmarshall(payload, attributes);
      expect(event.getData()).to.deep.equal(expected);
    });
  });
});
