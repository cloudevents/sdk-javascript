import "mocha";
import { expect } from "chai";
import nock from "nock";

import { emitBinary, emitStructured } from "../src/transport/http";
import { CloudEvent, Version } from "../src";
import { AxiosResponse } from "axios";

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const contentEncoding = "base64";
const contentType = "application/cloudevents+json; charset=utf-8";
const time = new Date();
const schemaurl = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar",
};
const dataBase64 = "Y2xvdWRldmVudHMK";

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

const cloudevent = new CloudEvent({
  specversion: Version.V03,
  type,
  source,
  datacontenttype: ceContentType,
  subject: "subject.ext",
  time,
  schemaurl,
  data,
  // set these so that deepEqual works
  dataschema: "",
  datacontentencoding: "",
  data_base64: "",
});
cloudevent[ext1Name] = ext1Value;
cloudevent[ext2Name] = ext2Value;

const cebase64 = new CloudEvent({
  specversion: Version.V03,
  type,
  source,
  datacontenttype: ceContentType,
  datacontentencoding: contentEncoding,
  time,
  schemaurl,
  data: dataBase64,
});
cebase64[ext1Name] = ext1Value;
cebase64[ext2Name] = ext2Value;

const webhook = "https://cloudevents.io/webhook";
const httpcfg = {
  method: "POST",
  url: `${webhook}/json`,
};

describe("HTTP Transport Binding - Version 0.3", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook).post("/json").reply(201, { status: "accepted" });
  });

  describe("Structured", () => {
    describe("JSON Format", () => {
      it(`requires '${contentType}' Content-Type in the header`, () =>
        emitStructured(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers["Content-Type"]).to.equal(contentType);
        }));

      it("the request payload should be correct", () =>
        emitStructured(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.data).to.deep.equal(JSON.stringify(cloudevent));
        }));

      describe("'data' attribute with 'base64' encoding", () => {
        it("the request payload should be correct", () =>
          emitStructured(cebase64, httpcfg).then((response: AxiosResponse) => {
            expect(JSON.parse(response.config.data).data).to.equal(cebase64.data);
          }));
      });
    });
  });

  describe("Binary", () => {
    describe("JSON Format", () => {
      it(`requires ${cloudevent.datacontenttype} in the header`, () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers["Content-Type"]).to.equal(cloudevent.datacontenttype);
        }));

      it("the request payload should be correct", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(JSON.parse(response.config.data)).to.deep.equal(cloudevent.data);
        }));

      it("HTTP Header contains 'ce-type'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-type");
        }));

      it("HTTP Header contains 'ce-specversion'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-specversion");
        }));

      it("HTTP Header contains 'ce-source'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-source");
        }));

      it("HTTP Header contains 'ce-id'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-id");
        }));

      it("HTTP Header contains 'ce-time'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-time");
        }));

      it("HTTP Header contains 'ce-schemaurl'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-schemaurl");
        }));

      it(`HTTP Header contains 'ce-${ext1Name}'`, () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property(`ce-${ext1Name}`);
        }));

      it(`HTTP Header contains 'ce-${ext2Name}'`, () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property(`ce-${ext2Name}`);
        }));

      it("HTTP Header contains 'ce-subject'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-subject");
        }));

      it("should 'ce-type' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.type).to.equal(response.config.headers["ce-type"]);
        }));

      it("should 'ce-specversion' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.specversion).to.equal(response.config.headers["ce-specversion"]);
        }));

      it("should 'ce-source' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.source).to.equal(response.config.headers["ce-source"]);
        }));

      it("should 'ce-id' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.id).to.equal(response.config.headers["ce-id"]);
        }));

      it("should 'ce-time' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.time).to.equal(response.config.headers["ce-time"]);
        }));

      it("should 'ce-schemaurl' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.schemaurl).to.equal(response.config.headers["ce-schemaurl"]);
        }));

      it(`should 'ce-${ext1Name}' have the right value`, () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent[ext1Name]).to.equal(response.config.headers[`ce-${ext1Name}`]);
        }));

      it(`should 'ce-${ext2Name}' have the right value`, () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent[ext2Name]).to.equal(response.config.headers[`ce-${ext2Name}`]);
        }));

      it("should 'ce-subject' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.subject).to.equal(response.config.headers["ce-subject"]);
        }));

      describe("'data' attribute with 'base64' encoding", () => {
        it("HTTP Header contains 'ce-datacontentencoding'", () =>
          emitBinary(cebase64, httpcfg).then((response: AxiosResponse) => {
            expect(response.config.headers).to.have.property("ce-datacontentencoding");
          }));

        it("should 'ce-datacontentencoding' have the right value", () =>
          emitBinary(cebase64, httpcfg).then((response: AxiosResponse) => {
            expect(cebase64.datacontentencoding).to.equal(response.config.headers["ce-datacontentencoding"]);
          }));
      });
    });
  });
});
