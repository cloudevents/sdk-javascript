var expect       = require("chai").expect;
var Cloudevent   = require("../index.js");
var nock         = require("nock");

const type        = "com.github.pull.create";
const source      = "urn:event:from:myapi/resourse/123";
const webhook     = "https://cloudevents.io/webhook";
const contentType = "application/cloudevents+json; charset=utf-8";

var cloudevent = new Cloudevent()
                       .type(type)
                       .source(source);

var httpcfg = {
  method : 'POST',
  url    : webhook + '/json'
};

var httpstructured_0_1 = 
  new Cloudevent.bindings['http-structured0.1'](httpcfg);

describe("HTTP Transport Binding - Version 0.1", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook)
      .post("/json")
      .reply(201, {status: 'accepted'});
  });

  describe("Structured", () => {
    describe("JSON Format", () => {
      it("requires '" + contentType + "' Content-Type in header", () => {
        return httpstructured_0_1.emit(cloudevent)
          .then(response => {
            //console.log(response.config);
            expect(response.config.headers['Content-Type'])
              .to.equal(contentType);
          });
      });
    });
  });
});

