var expect     = require("chai").expect;
var Cloudevent = require("../index.js");

var cloudevent = new Cloudevent(Cloudevent.specs['0.2'])
                       .type("com.github.pull.create")
                       .source("urn:event:from:myapi/resourse/123");

describe("CloudEvents Spec 0.2 - JavaScript SDK", () => {

  describe("JSON Format", () => {

    describe("Required context attributes", () => {
      it("requires 'type'", () => {
        expect(cloudevent.format()).to.have.property('type');
      });

      it("requires 'specversion'", () => {
        expect(cloudevent.format()).to.have.property('specversion');
      });

      it("requires 'source'", () => {
        expect(cloudevent.format()).to.have.property('source');
      });

      it("requires 'id'", () => {
        expect(cloudevent.format()).to.have.property('id');
      });
    });

  });

});
