import "mocha";
import { expect } from "chai";
import { CloudEvent, Version, ValidationError, Mode } from "../src";
import Constants from "../src/constants";

const id = "97699ec2-a8d9-47c1-bfa0-ff7aa526f838";
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date();
const schemaurl = "http://example.com/registry/myschema.json";
const data = {
  much: "wow",
};
const subject = "subject-x0";

const cloudevent = new CloudEvent({
  specversion: Version.V03,
  id,
  source,
  type,
  subject,
  time,
  data,
  schemaurl,
  datacontenttype: Constants.MIME_JSON,
});

describe("CloudEvents Spec v0.3", () => {
  describe("REQUIRED Attributes", () => {
    it("Should have 'id'", () => {
      expect(cloudevent.id).to.equal(id);
    });

    it("Should have 'source'", () => {
      expect(cloudevent.source).to.equal(source);
    });

    it("Should have 'specversion'", () => {
      expect(cloudevent.specversion).to.equal(Version.V03);
    });

    it("Should have 'type'", () => {
      expect(cloudevent.type).to.equal(type);
    });
  });

  describe("OPTIONAL Attributes", () => {
    it("Should have 'datacontentencoding'", () => {
      cloudevent.datacontentencoding = Constants.ENCODING_BASE64;
      expect(cloudevent.datacontentencoding).to.equal(Constants.ENCODING_BASE64);
    });

    it("Should have 'datacontenttype'", () => {
      expect(cloudevent.datacontenttype).to.equal(Constants.MIME_JSON);
    });

    it("Should have 'schemaurl'", () => {
      expect(cloudevent.schemaurl).to.equal(schemaurl);
    });

    it("Should have 'subject'", () => {
      expect(cloudevent.subject).to.equal(subject);
    });

    it("Should have 'time'", () => {
      expect(cloudevent.time).to.equal(time.toISOString());
    });

    it("Should have 'data'", () => {
      expect(cloudevent.data).to.deep.equal(data);
    });

    it("Should have the 'extension1'", () => {
      cloudevent.extension1 = "value1";
      expect(cloudevent.extension1).to.equal("value1");
    });
  });

  describe("The Constraints check", () => {
    describe("'id'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.id;
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.id = id;
      });

      it("should throw an error when is empty", () => {
        cloudevent.id = "";
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.id = id;
      });
    });

    describe("'source'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.source;
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.source = source;
      });
    });

    describe("'specversion'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.specversion;
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.specversion = Version.V03;
      });
    });

    describe("'type'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.type;
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.type = type;
      });

      it("should throw an error when is an empty string", () => {
        cloudevent.type = "";
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.type = type;
      });

      it("must be a non-empty string", () => {
        cloudevent.type = type;
        expect(cloudevent.type).to.equal(type);
      });
    });

    describe("'datacontentencoding'", () => {
      it("should throw an error when is a unsupported encoding", () => {
        cloudevent.data = "Y2xvdWRldmVudHMK";
        cloudevent.datacontentencoding = Mode.BINARY;
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        delete cloudevent.datacontentencoding;
        cloudevent.data = data;
      });

      it("should throw an error when 'data' does not carry base64", () => {
        cloudevent.data = "no base 64 value";
        cloudevent.datacontentencoding = Constants.ENCODING_BASE64;
        cloudevent.datacontenttype = "text/plain";

        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");

        delete cloudevent.datacontentencoding;
        cloudevent.data = data;
      });

      it("should accept when 'data' is a string", () => {
        cloudevent.data = "Y2xvdWRldmVudHMK";
        cloudevent.datacontentencoding = Constants.ENCODING_BASE64;
        expect(cloudevent.validate()).to.be.true;
        delete cloudevent.datacontentencoding;
        cloudevent.data = data;
      });
    });

    describe("'data'", () => {
      it("should maintain the type of data when no data content type", () => {
        delete cloudevent.datacontenttype;
        cloudevent.data = JSON.stringify(data);

        expect(typeof cloudevent.data).to.equal("string");
        cloudevent.datacontenttype = Constants.MIME_JSON;
      });

      it("should convert data with stringified json to a json object", () => {
        cloudevent.datacontenttype = Constants.MIME_JSON;
        cloudevent.data = JSON.stringify(data);
        expect(cloudevent.data).to.deep.equal(data);
      });
    });

    describe("'subject'", () => {
      it("should throw an error when is an empty string", () => {
        cloudevent.subject = "";
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.subject = subject;
      });
    });

    describe("'time'", () => {
      it("must adhere to the format specified in RFC 3339", () => {
        expect(cloudevent.time).to.equal(time.toISOString());
      });
    });
  });
});
