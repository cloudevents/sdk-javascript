import "mocha";
import { expect } from "chai";
import { CloudEvent, Version, ValidationError, Mode } from "../../src";
import Constants from "../../src/constants";

const id = "97699ec2-a8d9-47c1-bfa0-ff7aa526f838";
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date();
const schemaurl = "http://example.com/registry/myschema.json";
const data = {
  much: "wow",
};
const subject = "subject-x0";

let cloudevent = new CloudEvent({
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
      cloudevent = cloudevent.cloneWith({
        datacontentencoding: Constants.ENCODING_BASE64,
        data: "SSB3YXMgZnVubnkg8J+Ygg==",
      });
      expect(cloudevent.datacontentencoding).to.equal(Constants.ENCODING_BASE64);

      cloudevent = cloudevent.cloneWith({ datacontentencoding: undefined, data: data });
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
      cloudevent = cloudevent.cloneWith({ extension1: "value1" });
      expect(cloudevent.extension1).to.equal("value1");
    });
  });

  describe("The Constraints check", () => {
    describe("'id'", () => {
      it("should throw an error when trying to remove", () => {
        expect(() => {
          delete cloudevent.id;
        }).to.throw(TypeError);
      });

      it("defaut ID create when an empty string", () => {
        cloudevent = cloudevent.cloneWith({ id: "" });
        expect(cloudevent.id.length).to.be.greaterThan(0);
      });
    });

    describe("'source'", () => {
      it("should throw an error when trying to remove", () => {
        expect(() => {
          delete cloudevent.source;
        }).to.throw(TypeError);
      });
    });

    describe("'specversion'", () => {
      it("should throw an error when trying to remove", () => {
        expect(() => {
          delete cloudevent.specversion;
        }).to.throw(TypeError);
      });
    });

    describe("'type'", () => {
      it("should throw an error when trying to remove", () => {
        expect(() => {
          delete cloudevent.type;
        }).to.throw(TypeError);
      });

      it("should throw an error when is an empty string", () => {
        expect(() => {
          cloudevent.cloneWith({ type: "" });
        }).to.throw(ValidationError, "invalid payload");
      });

      it("must be a non-empty string", () => {
        cloudevent.cloneWith({ type: type });
        expect(cloudevent.type).to.equal(type);
      });
    });

    describe("'datacontentencoding'", () => {
      it("should throw an error when is a unsupported encoding", () => {
        expect(() => {
          cloudevent.cloneWith({ data: "Y2xvdWRldmVudHMK", datacontentencoding: Mode.BINARY });
        }).to.throw(ValidationError, "invalid payload");

        cloudevent.cloneWith({ data: data, datacontentencoding: undefined });
      });

      it("should throw an error when 'data' does not carry base64", () => {
        expect(() => {
          cloudevent.cloneWith({
            data: "no base 64 value",
            datacontentencoding: Constants.ENCODING_BASE64,
            datacontenttype: "text/plain",
          });
        }).to.throw(ValidationError, "invalid payload");

        cloudevent.cloneWith({
          data: data,
          datacontentencoding: undefined,
        });
      });

      it("should accept when 'data' is a string", () => {
        cloudevent.cloneWith({ data: "Y2xvdWRldmVudHMK", datacontentencoding: Constants.ENCODING_BASE64 });
        expect(cloudevent.validate()).to.be.true;
        cloudevent.cloneWith({ data: data, datacontentencoding: undefined });
      });
    });

    describe("'data'", () => {
      it("should maintain the type of data when no data content type", () => {
        cloudevent = cloudevent.cloneWith({ datacontenttype: undefined });
        cloudevent.data = JSON.stringify(data);

        expect(typeof cloudevent.data).to.equal("string");
      });

      it("should convert data with stringified json to a json object", () => {
        cloudevent = cloudevent.cloneWith({ datacontenttype: Constants.MIME_JSON });
        cloudevent.data = JSON.stringify(data);
        expect(cloudevent.data).to.deep.equal(data);
      });
    });

    describe("'subject'", () => {
      it("should throw an error when is an empty string", () => {
        expect(() => {
          cloudevent.cloneWith({ subject: "" });
        }).to.throw(ValidationError);
      });
    });

    describe("'time'", () => {
      it("must adhere to the format specified in RFC 3339", () => {
        cloudevent = cloudevent.cloneWith({ time: time });
        expect(cloudevent.time).to.equal(time.toISOString());
      });
    });
  });
});
