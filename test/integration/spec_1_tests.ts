import "mocha";
import { expect } from "chai";
import { CloudEvent, Version, ValidationError } from "../../src";
import { asBase64 } from "../../src/event/validation";
import Constants from "../../src/constants";

const id = "97699ec2-a8d9-47c1-bfa0-ff7aa526f838";
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time = new Date().toISOString();
const dataschema = "http://example.com/registry/myschema.json";
const data = {
  much: "wow",
};
const subject = "subject-x0";

let cloudevent = new CloudEvent({
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
      expect(cloudevent.time).to.equal(time);
    });
  });

  describe("Extensions Constraints", () => {
    it("should be ok when type is 'boolean'", () => {
      expect(cloudevent.cloneWith({ extboolean: true }).validate()).to.equal(true);
    });

    it("should be ok when type is 'integer'", () => {
      expect(cloudevent.cloneWith({ extinteger: 2019 }).validate()).to.equal(true);
    });

    it("should be ok when type is 'string'", () => {
      expect(cloudevent.cloneWith({ extstring: "an-string" }).validate()).to.equal(true);
    });

    it("should be ok when type is 'Uint32Array' for 'Binary'", () => {
      const myBinary = new Uint32Array(2019);
      expect(cloudevent.cloneWith({ extbinary: myBinary }).validate()).to.equal(true);
    });

    // URI
    it("should be ok when type is 'Date' for 'Timestamp'", () => {
      const myDate = new Date();
      expect(cloudevent.cloneWith({ extdate: myDate }).validate()).to.equal(true);
    });

    it("should be ok when the type is an object", () => {
      expect(cloudevent.cloneWith({ objectextension: { some: "object" } }).validate()).to.equal(true);
    });

    it("should be ok when the type is an string converted from an object", () => {
      expect(cloudevent.cloneWith({ objectextension: JSON.stringify({ some: "object" }) }).validate()).to.equal(true);
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
    });

    describe("'subject'", () => {
      it("should throw an error when is an empty string", () => {
        expect(() => {
          cloudevent.cloneWith({ subject: "" });
        }).to.throw(ValidationError, "invalid payload");
      });
    });

    describe("'time'", () => {
      it("must adhere to the format specified in RFC 3339", () => {
        const d = new Date();
        cloudevent = cloudevent.cloneWith({ time: d.toString() });
        // ensure that we always get back the same thing we passed in
        expect(cloudevent.time).to.equal(d.toString());
        // ensure that when stringified, the timestamp is in RFC3339 format
        expect(JSON.parse(JSON.stringify(cloudevent)).time).to.equal(new Date(d.toString()).toISOString());
      });
    });
  });

  describe("Event data constraints", () => {
    it("Should have 'data'", () => {
      expect(cloudevent.data).to.deep.equal(data);
    });

    it("should maintain the type of data when no data content type", () => {
      const dct = cloudevent.datacontenttype;
      cloudevent = cloudevent.cloneWith({ datacontenttype: undefined });
      cloudevent.data = JSON.stringify(data);

      expect(typeof cloudevent.data).to.equal("string");
      cloudevent = cloudevent.cloneWith({ datacontenttype: dct });
    });

    it("should be ok when type is 'Uint32Array' for 'Binary'", () => {
      const dataString = ")(*~^my data for ce#@#$%";

      const dataBinary = Uint32Array.from(dataString, (c) => c.codePointAt(0) as number);
      const expected = asBase64(dataBinary);

      cloudevent = cloudevent.cloneWith({ datacontenttype: "text/plain", data: dataBinary });

      expect(cloudevent.data_base64).to.equal(expected);
    });
  });
});
