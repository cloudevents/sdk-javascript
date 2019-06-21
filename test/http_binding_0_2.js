var expect = require("chai").expect;
var Cloudevent = require("../index.js");
var nock = require("nock");
var http = require("http");
var request = require("request");
var Spec02 = require("../lib/specs/spec_0_2.js");

var {HTTPBinary02} = require("../lib/bindings/http/emitter_binary_0_2.js");

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

const receiverConfig = {
  path   : "/events",
  port   : 10300,
  method : "POST"
};

const Structured02 = Cloudevent.bindings["http-structured0.2"];
const Binary02     = Cloudevent.bindings["http-binary0.2"];

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

var httpcfg = {
  method : "POST",
  url    : webhook + "/json"
};

var httpstructured02 = new Structured02(httpcfg);
var httpbinary02     = new Binary02(httpcfg);

describe("HTTP Transport Binding - Version 0.2", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook)
      .post("/json")
      .reply(201, {status: "accepted"});
  });

  describe("Structured", () => {
    describe("JSON Format", () => {
      it("requires '" + contentType + "' Content-Type in the header", () => {
        return httpstructured02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(contentType);
          });
      });

      it("the request payload should be correct", () => {
        return httpstructured02.emit(cloudevent)
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
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(cloudevent.getContenttype());
          });
      });

      it("the request payload should be correct", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(JSON.parse(response.config.data))
              .to.deep.equal(cloudevent.getData());
          });
      });

      it("HTTP Header contains 'ce-type'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-type");
          });
      });

      it("HTTP Header contains 'ce-specversion'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-specversion");
          });
      });

      it("HTTP Header contains 'ce-source'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-source");
          });
      });

      it("HTTP Header contains 'ce-id'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-id");
          });
      });

      it("HTTP Header contains 'ce-time'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-time");
          });
      });

      it("HTTP Header contains 'ce-schemaurl'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-schemaurl");
          });
      });

      it("HTTP Header contains 'ce-" + ext1Name + "'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-" + ext1Name);
          });
      });

      it("HTTP Header contains 'ce-" + ext2Name + "'", () => {
        return httpbinary02.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-" + ext2Name);
          });
      });
    });
  });
});
