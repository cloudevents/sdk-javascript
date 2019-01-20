var expect     = require("chai").expect;
var Cloudevent = require("../index.js");

const type   = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time   = new Date();
const schemaurl = "http://example.com/registry/myschema.json";
const contenttype = "application/json";
const data = {};
const extensions = {};

var cloudevent = new Cloudevent(Cloudevent.specs["0.2"])
                       .type(type)
                       .source(source);

describe("CloudEvents Spec 0.2 - JavaScript SDK", () => {

  describe("JSON Format", () => {

    describe("Required context attributes", () => {
      it("requires 'type'", () => {
        expect(cloudevent.format()).to.have.property("type");
      });

      it("requires 'specversion'", () => {
        expect(cloudevent.format()).to.have.property("specversion");
      });

      it("requires 'source'", () => {
        expect(cloudevent.format()).to.have.property("source");
      });

      it("requires 'id'", () => {
        expect(cloudevent.format()).to.have.property("id");
      });
    });

    describe("Optional context attributes", () => {
      it("contains 'time'", () => {
        cloudevent.time(time);
        expect(cloudevent.format()).to.have.property("time");
      });

      it("contains 'schemaurl'", () => {
        cloudevent.schemaurl(schemaurl);
        expect(cloudevent.format()).to.have.property("schemaurl");
      });

      it("contains 'contenttype'", () => {
        cloudevent.contenttype(contenttype);
        expect(cloudevent.format()).to.have.property("contenttype");
      });

      it("contains 'data'", () => {
        cloudevent.data(data);
        expect(cloudevent.format()).to.have.property("data");
      });

      it("contains 'extension1'", () => {
        cloudevent.addExtension("extension1", "value1");
        expect(cloudevent.format()).to.have.property("extension1");
      });

      it("'extension2' should have value equals to 'value1'", () => {
        cloudevent.addExtension("extension2", "value2");
        expect(cloudevent.format()["extension2"]).to.equal("value2");
      });
    });

    describe("The Constraints check", () => {
      describe("'type'", () => {
        it("should throw an error when is an empty string", () => {
          cloudevent.type("");
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
        });

        it("must be a non-empty string", () => {
          cloudevent.type(type);
          cloudevent.format();
        });

        it("should be prefixed with a reverse-DNS name", () => {
          //TODO how to assert it?
        });
      });

      describe("'specversion'", () => {
        it("compliant event producers must use a value of '0.2'", () => {
          expect(cloudevent.format()["specversion"]).to.equal("0.2");
        });

        it("should throw an error when is an empty string", () => {
          cloudevent.spec.payload.specversion = "";
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
          cloudevent.spec.payload.specversion = "0.2";
        });

        it("should throw an error when the value is not '0.2'", () => {
          cloudevent.spec.payload.specversion = "0.4";
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
          cloudevent.spec.payload.specversion = "0.2";
        });
      });

      describe("'id'", () => {
        it("should throw an error when is an empty string", () => {
          cloudevent.id("");
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
        });
        it("must be a non-empty string", () => {
          cloudevent.id("my.id-0x0090");
          cloudevent.format();
        });
      });

      describe("'time'", () => {
        it("must adhere to the format specified in RFC 3339", () => {
          cloudevent.time(time);
          expect(cloudevent.format()["time"]).to.equal(time.toISOString());
        });
      });
    });
  });

});
