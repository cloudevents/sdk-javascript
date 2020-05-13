const expect = require("chai").expect;
const Spec03 = require("../lib/specs/spec_0_3.js");
const { CloudEvent } = require("../index.js");
const {
  MIME_JSON,
  ENCODING_BASE64,
  SPEC_V03
} = require("../lib/bindings/http/constants.js");
const ValidationError = require("../lib/validation_error.js");

const id = "97699ec2-a8d9-47c1-bfa0-ff7aa526f838";
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date();
const schemaurl = "http://example.com/registry/myschema.json";
const data = {
  much: "wow"
};
const subject = "subject-x0";

const cloudevent =
  new CloudEvent(Spec03)
    .id(id)
    .source(source)
    .type(type)
    .dataContentType(MIME_JSON)
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
      expect(cloudevent.getSpecversion()).to.equal(SPEC_V03);
    });

    it("Should have 'type'", () => {
      expect(cloudevent.getType()).to.equal(type);
    });
  });

  describe("OPTIONAL Attributes", () => {
    it("Should have 'datacontentencoding'", () => {
      cloudevent.dataContentEncoding(ENCODING_BASE64);
      expect(cloudevent.spec.payload.datacontentencoding)
        .to.equal(ENCODING_BASE64);
      delete cloudevent.spec.payload.datacontentencoding;
    });

    it("Should have 'datacontenttype'", () => {
      expect(cloudevent.getDataContentType()).to.equal(MIME_JSON);
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
      expect(cloudevent.spec.payload.extension1)
        .to.equal("value1");
    });

    it("should throw an error when use a reserved name as extension", () => {
      expect(cloudevent.addExtension.bind(cloudevent, "id"))
        .to.throw(ValidationError, "Reserved attribute name: 'id'");
    });
  });

  describe("The Constraints check", () => {
    describe("'id'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.id;
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.id = id;
      });

      it("should throw an erro when is empty", () => {
        cloudevent.spec.payload.id = "";
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.id = id;
      });
    });

    describe("'source'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.source;
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.source = source;
      });
    });

    describe("'specversion'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.specversion;
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.specversion = SPEC_V03;
      });

      it("should throw an error when is empty", () => {
        cloudevent.spec.payload.specversion = "";
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.specversion = SPEC_V03;
      });
    });

    describe("'type'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.type;
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.type = type;
      });

      it("should throw an error when is an empty string", () => {
        cloudevent.type("");
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.type(type);
      });

      it("must be a non-empty string", () => {
        cloudevent.type(type);
        expect(cloudevent.spec.payload.type).to.equal(type);
      });
    });

    describe("'datacontentencoding'", () => {
      it("should throw an error when is a unsupported encoding", () => {
        cloudevent
          .data("Y2xvdWRldmVudHMK")
          .dataContentEncoding("binary");
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        delete cloudevent.spec.payload.datacontentencoding;
        cloudevent.data(data);
      });

      it("should throw an error when 'data' does not carry base64",
        () => {
          cloudevent
            .data("no base 64 value")
            .dataContentEncoding(ENCODING_BASE64)
            .dataContentType("text/plain");

          expect(cloudevent.format.bind(cloudevent))
            .to.throw(ValidationError, "invalid payload");

          delete cloudevent.spec.payload.datacontentencoding;
          cloudevent.data(data);
        });

      it("should accept when 'data' is a string", () => {
        cloudevent
          .data("Y2xvdWRldmVudHMK")
          .dataContentEncoding(ENCODING_BASE64);
        expect(cloudevent.format()).to.have.property("datacontentencoding");
        delete cloudevent.spec.payload.datacontentencoding;
        cloudevent.data(data);
      });
    });

    describe("'data'", () => {
      it("should maintain the type of data when no data content type", () => {
        delete cloudevent.spec.payload.datacontenttype;
        cloudevent
          .data(JSON.stringify(data));

        expect(typeof cloudevent.getData()).to.equal("string");
        cloudevent.dataContentType(MIME_JSON);
      });

      it("should convert data with stringified json to a json object", () => {
        cloudevent
          .dataContentType(MIME_JSON)
          .data(JSON.stringify(data));
        expect(cloudevent.getData()).to.deep.equal(data);
      });
    });

    describe("'subject'", () => {
      it("should throw an error when is an empty string", () => {
        cloudevent.subject("");
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.subject(type);
      });
    });

    describe("'time'", () => {
      it("must adhere to the format specified in RFC 3339", () => {
        cloudevent.time(time);
        expect(cloudevent.format().time).to.equal(time.toISOString());
      });
    });
  });
});
