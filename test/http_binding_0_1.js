var expect       = require("chai").expect;
var Cloudevent   = require("../index.js");
var nock         = require("nock");

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

const ext1Name  = "extension1";
const ext1Value = "foobar";
const ext2Name  = "extension2";
const ext2Value = "acme";

const Structured01 = Cloudevent.bindings["http-structured0.1"];
const Binary01     = Cloudevent.bindings["http-binary0.1"];

var cloudevent =
  new Cloudevent()
    .type(type)
    .source(source)
    .contenttype(ceContentType)
    .time(now)
    .schemaurl(schemaurl)
    .data(data)
    .addExtension(ext1Name, ext1Value)
    .addExtension(ext2Name, ext2Value);

cloudevent.eventTypeVersion("1.0.0");

var httpcfg = {
  method : "POST",
  url    : webhook + "/json"
};

var httpstructured01 = new Structured01(httpcfg);
var httpbinary01     = new Binary01(httpcfg);

describe("HTTP Transport Binding - Version 0.1", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook)
      .post("/json")
      .reply(201, {status: "accepted"});
  });

  describe("Structured", () => {
    describe("JSON Format", () => {
      it("requires '" + contentType + "' Content-Type in the header", () => {
        return httpstructured01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(contentType);
          });
      });

      it("the request payload should be correct", () => {
        return httpstructured01.emit(cloudevent)
          .then((response) => {
            expect(JSON.parse(response.config.data))
              .to.deep.equal(cloudevent.format());
          });
      });
    });
  });

  describe("Binary", () => {
    describe("JSON Format", () => {
      it("requires '" + cloudevent.getContenttype() + "' Content-Type in the header", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(cloudevent.getContenttype());
          });
      });

      it("the request payload should be correct", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(JSON.parse(response.config.data))
              .to.deep.equal(cloudevent.getData());
          });
      });

      it("HTTP Header contains 'CE-EventType'", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-EventType");
          });
      });

      it("HTTP Header contains 'CE-EventTypeVersion'", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-EventTypeVersion");
          });
      });

      it("HTTP Header contains 'CE-CloudEventsVersion'", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-CloudEventsVersion");
          });
      });

      it("HTTP Header contains 'CE-Source'", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-Source");
          });
      });

      it("HTTP Header contains 'CE-EventID'", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-EventID");
          });
      });

      it("HTTP Header contains 'CE-EventTime'", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-EventTime");
          });
      });

      it("HTTP Header contains 'CE-SchemaURL'", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-SchemaURL");
          });
      });

      it("HTTP Header contains 'CE-X-Extension1' as extension", () => {
        return httpbinary01.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("CE-X-Extension1");
          });
      });
    });
  });
});
