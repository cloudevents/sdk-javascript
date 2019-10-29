const expect = require("chai").expect;
const Spec1 = require("../lib/specs/spec_1.js");
const Cloudevent = require("../index.js");
const uuid  = require("uuid/v4");

const id = uuid();
const type   = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time   = new Date();
const dataschema = "http://example.com/registry/myschema.json";
const dataContentType = "application/json";
const data = {
  much : "wow"
};
const extensions = {};
const subject = "subject-x0";

const cloudevent =
  new Cloudevent(Spec1)
    .id(id)
    .source(source)
    .type(type)
    .dataContentType(dataContentType)
    .dataschema(dataschema)
    .subject(subject)
    .time(time)
    .data(data);

describe("CloudEvents Spec v1.0", () => {
  describe("REQUIRED Attributes", () => {
    it("Should have 'id'", () => {
      expect(cloudevent.getId()).to.equal(id);
    });

    it("Should have 'source'", () => {
      expect(cloudevent.getSource()).to.equal(source);
    });

    it("Should have 'specversion'", () => {
      expect(cloudevent.getSpecversion()).to.equal("1.0");
    });

    it("Should have 'type'", () => {
      expect(cloudevent.getType()).to.equal(type);
    });
  });

  describe("OPTIONAL Attributes", () => {
    it("Should have 'datacontenttype'", () => {
      expect(cloudevent.getDataContentType()).to.equal(dataContentType);
    });

    it("Should have 'dataschema'", () => {
      expect(cloudevent.getDataschema()).to.equal(dataschema);
    });

    it("Should have 'subject'", () => {
      expect(cloudevent.getSubject()).to.equal(subject);
    });

    it("Should have 'time'", () => {
      expect(cloudevent.getTime()).to.equal(time.toISOString());
    });

    it("Should have 'data'", () => {
      expect(cloudevent.getData()).to.deep.equal(data);
    });
  });
});
