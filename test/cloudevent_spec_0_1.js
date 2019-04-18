var expect       = require("chai").expect;
var Cloudevent   = require("../index.js");

const type   = "com.github.pull.create01";
const source = "urn:event:from:myapi/resourse/01";
const time   = new Date();
const schemaurl = "http://example.com/registry/v01/myschema.json";
const contenttype = "application/json";
const data = {};
const extensions = {};

var cloudevent = new Cloudevent()
                       .type(type)
                       .source(source);

describe("CloudEvents Spec 0.1 - JavaScript SDK", () => {

  describe("Object properties", () => {

    describe("Attribute getters", () => {
      it("returns 'type'", () => {
        expect(cloudevent.getType()).to.equal(type);
      });

      it("returns 'source'", () => {
        expect(cloudevent.getSource()).to.equal(source);
      });
    });
  });

  describe("JSON Format", () => {

    describe("Required context attributes", () => {
      it("requires 'eventType'", () => {
        expect(cloudevent.format()).to.have.property("eventType");
      });

      it("requires 'eventTypeVersion'", () => {
        cloudevent.eventTypeVersion("1.0");
        expect(cloudevent.format()).to.have.property("eventTypeVersion");
      });

      it("requires 'cloudEventsVersion'", () => {
        expect(cloudevent.format()).to.have.property("cloudEventsVersion");
      });

      it("requires 'source'", () => {
        expect(cloudevent.format()).to.have.property("source");
      });

      it("requires 'eventID'", () => {
        expect(cloudevent.format()).to.have.property("eventID");
      });
    });

    describe("Optional context attributes", () => {
      it("contains 'eventTime'", () => {
        cloudevent.time(time);
        expect(cloudevent.format()).to.have.property("eventTime");
      });

      it("contains 'schemaURL'", () => {
        cloudevent.schemaurl(schemaurl);
        expect(cloudevent.format()).to.have.property("schemaURL");
      });

      it("contains 'contentType'", () => {
        cloudevent.contenttype(contenttype);
        expect(cloudevent.format()).to.have.property("contentType");
      });

      it("contains 'data'", () => {
        cloudevent.data(data);
        expect(cloudevent.format()).to.have.property("data");
      });

      it("contains 'extensions'", () => {
        cloudevent.addExtension("foo", "value");
        expect(cloudevent.format()).to.have.property("extensions");
      });

      it("'extensions' should have 'bar' extension", () => {
        cloudevent.addExtension("bar", "value");
        expect(cloudevent.format().extensions)
          .to.have.property("foo");
      });

    });

    describe("The Constraints check", () => {
      describe("'eventType'", () => {
        it("should throw an error when is an empty string", () => {
          cloudevent.type("");
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("'eventType' is invalid");
        });

        it("must be a non-empty string", () => {
          cloudevent.type(type);
          cloudevent.format();
        });

        it("should be prefixed with a reverse-DNS name", () => {
          //TODO how to assert it?
        });
      });

      //TODO another attributes . . .

      describe("'eventTime'", () => {
        it("must adhere to the format specified in RFC 3339", () => {
          cloudevent.time(time);
          expect(cloudevent.format()["eventTime"]).to.equal(time.toISOString());
        });
      });
    });

  });

});
