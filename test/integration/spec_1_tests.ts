import "mocha";
import { expect } from "chai";
import { CloudEvent, Version, ValidationError } from "../../src";
import { asBase64 } from "../../src/event/validation";
import Constants from "../../src/constants";

const id = "97699ec2-a8d9-47c1-bfa0-ff7aa526f838";
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date();
const dataschema = "http://example.com/registry/myschema.json";
const data = {
  much: "wow",
};
const subject = "subject-x0";

const cloudevent = new CloudEvent({
  specversion: Version.V1,
  id,
  source,
  type,
  subject,
  time,
  data,
  dataschema,
  datacontenttype: Constants.MIME_JSON,
});

describe("CloudEvents Spec v1.0", () => {
  describe("REQUIRED Attributes", () => {
    it("Should have 'id'", () => {
      expect(cloudevent.id).to.equal(id);
    });

    it("Should have 'source'", () => {
      expect(cloudevent.source).to.equal(source);
    });

    it("Should have 'specversion'", () => {
      expect(cloudevent.specversion).to.equal("1.0");
    });

    it("Should have 'type'", () => {
      expect(cloudevent.type).to.equal(type);
    });
  });

  describe("OPTIONAL Attributes", () => {
    it("Should have 'datacontenttype'", () => {
      expect(cloudevent.datacontenttype).to.equal(Constants.MIME_JSON);
    });

    it("Should have 'dataschema'", () => {
      expect(cloudevent.dataschema).to.equal(dataschema);
    });

    it("Should have 'subject'", () => {
      expect(cloudevent.subject).to.equal(subject);
    });

    it("Should have 'time'", () => {
      expect(cloudevent.time).to.equal(time.toISOString());
    });
  });

  describe("Extensions Constraints", () => {
    it("should be ok when type is 'boolean'", () => {
      cloudevent["ext-boolean"] = true;
      expect(cloudevent.validate()).to.equal(true);
    });

    it("should be ok when type is 'integer'", () => {
      cloudevent["ext-integer"] = 2019;
      expect(cloudevent.validate()).to.equal(true);
    });

    it("should be ok when type is 'string'", () => {
      cloudevent["ext-string"] = "an-string";
      expect(cloudevent.validate()).to.equal(true);
    });

    it("should be ok when type is 'Uint32Array' for 'Binary'", () => {
      const myBinary = new Uint32Array(2019);
      cloudevent["ext-binary"] = myBinary;
      expect(cloudevent.validate()).to.equal(true);
    });

    // URI
    it("should be ok when type is 'Date' for 'Timestamp'", () => {
      const myDate = new Date();
      cloudevent["ext-date"] = myDate;
      expect(cloudevent.validate()).to.equal(true);
    });

    // even though the spec doesn't allow object types for
    // extensions, it could be JSON. And before a JS CE
    // is transmitted across the wire, this value will be
    // converted to JSON
    it("should be ok when the type is an object", () => {
      cloudevent["object-extension"] = { some: "object" };
      expect(cloudevent.validate()).to.equal(true);
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
        cloudevent.specversion = Version.V1;
      });

      it("should throw an error when is empty", () => {
        cloudevent.specversion = "" as Version;
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.specversion = Version.V1;
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
    });

    describe("'subject'", () => {
      it("should throw an error when is an empty string", () => {
        cloudevent.subject = "";
        expect(cloudevent.validate.bind(cloudevent)).to.throw(ValidationError, "invalid payload");
        cloudevent.subject = type;
      });
    });

    describe("'time'", () => {
      it("must adhere to the format specified in RFC 3339", () => {
        cloudevent.time = time;
        expect(cloudevent.time).to.equal(time.toISOString());
      });
    });
  });

  describe("Event data constraints", () => {
    it("Should have 'data'", () => {
      expect(cloudevent.data).to.deep.equal(data);
    });

    it("should maintain the type of data when no data content type", () => {
      const dct = cloudevent.datacontenttype;
      delete cloudevent.datacontenttype;
      cloudevent.data = JSON.stringify(data);

      expect(typeof cloudevent.data).to.equal("string");
      cloudevent.datacontenttype = dct;
    });

    it("should convert data with stringified json to a json object", () => {
      cloudevent.datacontenttype = Constants.MIME_JSON;
      cloudevent.data = JSON.stringify(data);
      expect(cloudevent.data).to.deep.equal(data);
    });

    it("should be ok when type is 'Uint32Array' for 'Binary'", () => {
      const dataString = ")(*~^my data for ce#@#$%";

      const dataBinary = Uint32Array.from(dataString, (c) => c.codePointAt(0) as number);
      const expected = asBase64(dataBinary);
      const olddct = cloudevent.datacontenttype;

      cloudevent.datacontenttype = "text/plain";
      cloudevent.data = dataBinary;
      expect(cloudevent.data_base64).to.equal(expected);

      cloudevent.datacontenttype = olddct;
    });
  });
});
