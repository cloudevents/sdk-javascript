var expect = require("chai").expect;
var Unmarshaller = require("../../../http/unmarshaller/v02.js");
var Cloudevent   = require("../../../index.js");

const type        = "com.github.pull.create";
const source      = "urn:event:from:myapi/resourse/123";
const webhook     = "https://cloudevents.io/webhook";
const contentType = "application/cloudevents+json; charset=utf-8";
const now         = new Date();
const schemaurl   = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};

describe("HTTP Transport Binding Unmarshaller for CloudEvents v0.2", () => {

  it("Throw error when payload is null", () => {
    // setup
    var payload = null;
    var un = new Unmarshaller();

    // act and assert
    return un.unmarshall(payload)
      .then(actual => {throw {message: "failed"}})
      .catch(err =>
        expect(err.message).to.equal("payload is null or undefined"));
  });

  it("Throw error when headers is null", () => {
    // setup
    var payload = {};
    var headers = null;
    var un = new Unmarshaller();

    // act and assert
    return un.unmarshall(payload, headers)
      .then(actual => {throw {message: "failed"}})
      .catch(err =>
        expect(err.message).to.equal("headers is null or undefined"));
  });

  it("Throw error when there is no content-type header", () => {
    // setup
    var payload = {};
    var headers = {};
    var un = new Unmarshaller();

    // act and assert
    un.unmarshall(payload, headers)
      .then(actual => {throw {message: "failed"}})
      .catch(err =>
        expect(err.message).to.equal("content-type header not found"));
  });

  it("Throw error when content-type is not allowed", () => {
    // setup
    var payload = {};
    var headers = {
      "content-type":"text/xml"
    };
    var un = new Unmarshaller();

    // act and assert
    un.unmarshall(payload, headers)
      .then(actual => {throw {message: "failed"}})
      .catch(err =>
        expect(err.message).to.equal("content type not allowed"));
  });

  describe("Structured", () => {
    it("Throw error when has not allowed mime", () => {
      // setup
      var payload = {};
      var headers = {
        "content-type":"application/cloudevents+zip"
      };
      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, headers)
        .then(actual => {throw {message: "failed"}})
        .catch(err =>
          expect(err.message).to.equal("structured+type not allowed"));
    });

    it("Throw error when the event does not follow the spec 0.2", () => {
      // setup
      var payload =
        new Cloudevent()
          .type(type)
          .source(source)
          .contenttype(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .data(data)
          .toString();

      var headers = {
        "content-type":"application/cloudevents+json"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, headers)
        .then(actual => {throw {message: "failed"}})
        .catch(err =>
          expect(err.message).to.equal("invalid payload"));
    });

    it("Should accept event that follow the spec 0.2", () => {
      // setup
      var payload =
        new Cloudevent(Cloudevent.specs["0.2"])
          .type(type)
          .source(source)
          .contenttype(ceContentType)
          .time(now)
          .schemaurl(schemaurl)
          .data(data)
          .toString();

      var headers = {
        "content-type":"application/cloudevents+json"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, headers)
        .then(actual =>
          expect(actual).to.be.an("object"));

    });
  });

  describe("Binary", () => {
    it("Throw error when has not allowed mime", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.2",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "text/html"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, attributes)
        .then(actual => {throw {message: "failed"}})
        .catch(err =>
          expect(err.message).to.equal("content type not allowed"));

    });

    it("Throw error when the event does not follow the spec 0.2", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"               : "type",
        "CE-CloudEventsVersion" : "0.1",
        "ce-source"             : "source",
        "ce-id"                 : "id",
        "ce-time"               : "2019-06-16T11:42:00Z",
        "ce-schemaurl"          : "http://schema.registry/v1",
        "Content-Type"          : "application/json"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, attributes)
        .then(actual => {throw {message: "failed"}})
        .catch(err =>
          expect(err.message).to.not.empty);
    });

    it("No error when all attributes are in place", () => {
      // setup
      var payload = {
        "data" : "dataString"
      };
      var attributes = {
        "ce-type"        : "type",
        "ce-specversion" : "0.2",
        "ce-source"      : "source",
        "ce-id"          : "id",
        "ce-time"        : "2019-06-16T11:42:00Z",
        "ce-schemaurl"   : "http://schema.registry/v1",
        "Content-Type"   : "application/json"
      };

      var un = new Unmarshaller();

      // act and assert
      un.unmarshall(payload, attributes)
        .then(actual => expect(actual).to.be.an("object"));

    });
  });
});
