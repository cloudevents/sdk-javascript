const expect = require("chai").expect;
const Spec03 = require("../lib/specs/spec_0_3.js");
const Cloudevent = require("../index.js");
const uuid  = require("uuid/v4");

const id = uuid();
const type   = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time   = new Date();
const schemaurl = "http://example.com/registry/myschema.json";
const dataContentEncoding = "base64";
const dataContentType = "application/json";
const data = {
  much : "wow"
};
const extensions = {};
const subject = "subject-x0";

var cloudevent =
  new Cloudevent(Spec03)
    .id(id)
    .source(source)
    .type(type)
    .dataContentType(dataContentType)
    .schemaurl(schemaurl)
    .subject(subject)
    .time(time)
    .data(data);

describe("CloudEvents Spec v0.3", () => {

  describe("REQUIRED Attributes", () => {
    it("Should have 'id'", () => {
      expect(cloudevent.getId()).to.equal(id);
    });

    it("Should have 'source'", () => {
      expect(cloudevent.getSource()).to.equal(source);
    });

    it("Should have 'specversion'", () => {
      expect(cloudevent.getSpecversion()).to.equal("0.3");
    });

    it("Should have 'type'", () => {
      expect(cloudevent.getType()).to.equal(type);
    });
  });

  describe("OPTIONAL Attributes", () => {
    it("Should have 'datacontentencoding'", () => {
      cloudevent.dataContentEncoding(dataContentEncoding);
      expect(cloudevent.spec.payload.datacontentencoding)
        .to.equal(dataContentEncoding);
      delete cloudevent.spec.payload.datacontentencoding;
    });

    it("Should have 'datacontenttype'", () => {
      expect(cloudevent.getDataContentType()).to.equal(dataContentType);
    });

    it("contenttype() method should maps to 'datacontenttype'", () => {
      cloudevent.contenttype("text/xml");
      expect(cloudevent.spec.payload.datacontenttype).to.equal("text/xml");
      cloudevent.contenttype(dataContentType);
    });

    it("Should have 'schemaurl'", () => {
      expect(cloudevent.getSchemaurl()).to.equal(schemaurl);
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

    it("Should have the 'extension1'", () => {
      cloudevent.addExtension("extension1", "value1");
      expect(cloudevent.spec.payload["extension1"])
        .to.equal("value1");
    });

    it("should throw an error when use a reserved name as extension", () => {
      expect(cloudevent.addExtension.bind(cloudevent, "id"))
        .to.throw("Reserved attribute name: 'id'");
    });
  });

  describe("The Constraints check", () => {
    describe("'id'", () => {
      it("should throw an error when is absent", () => {
          delete cloudevent.spec.payload.id;
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
          cloudevent.spec.payload.id = id;
      });

      it("should throw an erro when is empty", () => {
        cloudevent.spec.payload.id = "";
        expect(cloudevent.format.bind(cloudevent))
          .to
          .throw("invalid payload");
        cloudevent.spec.payload.id = id;
      });
    });

    describe("'source'", () => {
      it("should throw an error when is absent", () => {
          delete cloudevent.spec.payload.source;
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
          cloudevent.spec.payload.source = source;
      });
    });

    describe("'specversion'", () => {
      it("should throw an error when is absent", () => {
          delete cloudevent.spec.payload.specversion;
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
          cloudevent.spec.payload.specversion = "0.3";
      });

      it("should throw an error when is empty", () => {
        cloudevent.spec.payload.specversion = "";
        expect(cloudevent.format.bind(cloudevent))
          .to
          .throw("invalid payload");
        cloudevent.spec.payload.specversion = "0.3";
      });
    });

    describe("'type'", () => {
      it("should throw an error when is absent", () => {
          delete cloudevent.spec.payload.type;
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("invalid payload");
          cloudevent.spec.payload.type = type;
      });

      it("should throw an error when is an empty string", () => {
        cloudevent.type("");
        expect(cloudevent.format.bind(cloudevent))
          .to
          .throw("invalid payload");
        cloudevent.type(type);
      });

      it("must be a non-empty string", () => {
        cloudevent.type(type);
        expect(cloudevent.spec.payload.type).to.equal(type);
      });
    });

    describe("'datacontentencoding'", () => {
      it("should throw an error when is a unsupported encoding" , () => {
        cloudevent
          .data("Y2xvdWRldmVudHMK")
          .dataContentEncoding("binary");
        expect(cloudevent.format.bind(cloudevent))
          .to
          .throw("invalid payload");
        delete cloudevent.spec.payload.datacontentencoding;
        cloudevent.data(data);
      });

      it("should throw an error when 'data' does not carry base64",
        () => {

        cloudevent
          .data("no base 64 value")
          .dataContentEncoding("base64")
          .dataContentType("text/plain");

        expect(cloudevent.format.bind(cloudevent))
          .to
          .throw("invalid payload");

        delete cloudevent.spec.payload.datacontentencoding;
        cloudevent.data(data);
      });

      it("should accept when 'data' is a string", () => {
        cloudevent
          .data("Y2xvdWRldmVudHMK")
          .dataContentEncoding("base64");
        expect(cloudevent.format()).to.have.property("datacontentencoding");
        delete cloudevent.spec.payload.datacontentencoding;
        cloudevent.data(data);
      });
    });

    describe("'data'", () => {
      it("should maintain the type of data when no data content type", () =>{
        delete cloudevent.spec.payload.datacontenttype;
        cloudevent
          .data(JSON.stringify(data));

        expect(typeof cloudevent.getData()).to.equal("string");  
        cloudevent.dataContentType(dataContentType);
      });

      it("should convert data with stringified json to a json object", () => {
        cloudevent
          .dataContentType(dataContentType)
          .data(JSON.stringify(data));
        expect(cloudevent.getData()).to.deep.equal(data);
      });
    });

    describe("'subject'", () => {
      it("should throw an error when is an empty string", () => {
        cloudevent.subject("");
        expect(cloudevent.format.bind(cloudevent))
          .to
          .throw("invalid payload");
        cloudevent.subject(type);
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
