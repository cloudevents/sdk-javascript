var expect       = require("chai").expect;
var Cloudevent   = require("../index.js");

var cloudevent = new Cloudevent()
                       .type("com.github.pull.create")
                       .source("urn:event:from:myapi/resourse/123");

describe("CloudEvents Spec 0.1 - JavaScript SDK", () => {

  describe("JSON Format", () => {

    describe("Required context attributes", () => {
      it("requires 'eventType'", () => {
        expect(cloudevent.format()).to.have.property('eventType');
      });

      it("requires 'cloudEventsVersion'", () => {
        expect(cloudevent.format()).to.have.property('cloudEventsVersion');
      });

      it("requires 'source'", () => {
        expect(cloudevent.format()).to.have.property('source');
      });

      it("requires 'eventID'", () => {
        expect(cloudevent.format()).to.have.property('eventID');
      });
    });

  });

});
