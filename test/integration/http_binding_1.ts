import * as https from "https";
import "mocha";
import { expect } from "chai";
import nock from "nock";

import { CloudEvent, Version } from "../../src";
import { emitBinary, emitStructured } from "../../src/transport/http/emitter";
import { asBase64 } from "../../src/event/validation";
import { AxiosResponse } from "axios";

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resource/123";
const contentType = "application/cloudevents+json; charset=utf-8";
const time = new Date();
const subject = "subject.ext";
const dataschema = "http://cloudevents.io/schema.json";
const datacontenttype = "application/json";

const data = {
  foo: "bar",
};

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

let cloudevent = new CloudEvent({
  specversion: Version.V1,
  type,
  source,
  datacontenttype,
  subject,
  time,
  dataschema,
  data,
});
cloudevent = cloudevent.cloneWith({ [ext1Name]: ext1Value, [ext2Name]: ext2Value });

const dataString = ")(*~^my data for ce#@#$%";

const webhook = "https://cloudevents.io/webhook/v1";
const httpcfg = { url: `${webhook}/json` };

describe("HTTP Transport Binding - Version 1.0", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook).post("/json").reply(201, { status: "accepted" });
  });

  describe("Structured", () => {
    it("works with mTLS authentication", () => {
      const httpsAgent = new https.Agent({
        cert: "some value",
        key: "other value",
      });

      return emitStructured(cloudevent, { ...httpcfg, httpsAgent }).then((response: AxiosResponse) => {
        expect(response.config.headers["Content-Type"]).to.equal(contentType);
      });
    });

    describe("JSON Format", () => {
      it(`requires '${contentType}' Content-Type in the header`, () =>
        emitStructured(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers["Content-Type"]).to.equal(contentType);
        }));

      it("the request payload should be correct", () =>
        emitStructured(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.data).to.deep.equal(JSON.stringify(cloudevent));
        }));

      describe("Binary event data", () => {
        it("the request payload should be correct when data is binary", () => {
          const bindata = Uint32Array.from(dataString as string, (c) => c.codePointAt(0) as number);
          const expected = asBase64(bindata);
          const binevent = new CloudEvent({
            type,
            source,
            datacontenttype: "text/plain",
            data: bindata,
            [ext1Name]: ext1Value,
            [ext2Name]: ext2Value,
          });

          return emitStructured(binevent, httpcfg).then((response: AxiosResponse) => {
            expect(JSON.parse(response.config.data).data_base64).to.equal(expected);
          });
        });

        it("the payload must have 'data_base64' when data is binary", () => {
          const binevent = new CloudEvent({
            type,
            source,
            datacontenttype: "text/plain",
            data: Uint32Array.from(dataString as string, (c) => c.codePointAt(0) as number),
            [ext1Name]: ext1Value,
            [ext2Name]: ext2Value,
          });

          return emitStructured(binevent, httpcfg).then((response: AxiosResponse) => {
            expect(JSON.parse(response.config.data)).to.have.property("data_base64");
          });
        });
      });
    });
  });

  describe("Binary", () => {
    it("works with mTLS authentication", () =>
      emitBinary(cloudevent, {
        url: `${webhook}/json`,
        httpsAgent: new https.Agent({
          cert: "some value",
          key: "other value",
        }),
      }).then((response: AxiosResponse) => {
        expect(response.config.headers["Content-Type"]).to.equal(cloudevent.datacontenttype);
      }));

    describe("JSON Format", () => {
      it(`requires '${cloudevent.datacontenttype}' in the header`, () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers["Content-Type"]).to.equal(cloudevent.datacontenttype);
        }));

      it("the request payload should be correct", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(JSON.parse(response.config.data)).to.deep.equal(cloudevent.data);
        }));

      it("the request payload should be correct when event data is binary", () => {
        const bindata = Uint32Array.from(dataString as string, (c) => c.codePointAt(0) as number);
        const expected = asBase64(bindata);
        const binevent = new CloudEvent({
          type,
          source,
          datacontenttype: "text/plain",
          data: bindata,
        });

        return emitBinary(binevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.data).to.equal(expected);
        });
      });

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

      it("HTTP Header contains 'ce-dataschema'", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(response.config.headers).to.have.property("ce-dataschema");
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

      it("should 'ce-dataschema' have the right value", () =>
        emitBinary(cloudevent, httpcfg).then((response: AxiosResponse) => {
          expect(cloudevent.dataschema).to.equal(response.config.headers["ce-dataschema"]);
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
    });
  });
});
