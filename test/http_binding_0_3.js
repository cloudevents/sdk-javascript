const expect = require("chai").expect;
const nock = require("nock");
const BinaryHTTPEmitter = require("../lib/bindings/http/emitter_binary.js");
const StructuredHTTPEmitter = require("../lib/bindings/http/emitter_structured.js");
const { CloudEvent } = require("../");
const {
  SPEC_V03
} = require("../lib/bindings/http/constants.js");

const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const contentEncoding = "base64";
const contentType = "application/cloudevents+json; charset=utf-8";
const time = new Date();
const schemaURL = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};
const dataBase64 = "Y2xvdWRldmVudHMK";

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

const cloudevent = new CloudEvent({
  specversion: SPEC_V03,
  type,
  source,
  dataContentType: ceContentType,
  subject: "subject.ext",
  time,
  schemaURL,
  data
});
cloudevent.addExtension(ext1Name, ext1Value);
cloudevent.addExtension(ext2Name, ext2Value);

const cebase64 = new CloudEvent({
  specversion: SPEC_V03,
  type,
  source,
  dataContentType: ceContentType,
  dataContentEncoding: contentEncoding,
  time,
  schemaURL,
  data: dataBase64
});
cebase64.addExtension(ext1Name, ext1Value);
cebase64.addExtension(ext2Name, ext2Value);

const webhook = "https://cloudevents.io/webhook";
const httpcfg = {
  method: "POST",
  url: `${webhook}/json`
};

const binary = new BinaryHTTPEmitter(SPEC_V03);
const structured = new StructuredHTTPEmitter();

describe("HTTP Transport Binding - Version 0.3", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook)
      .post("/json")
      .reply(201, { status: "accepted" });
  });

  describe("Structured", () => {
    describe("JSON Format", () => {
      it(`requires '${contentType}' Content-Type in the header`,
        () => structured.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(contentType);
          }));

      it("the request payload should be correct",
        () => structured.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(JSON.parse(response.config.data))
              .to.deep.equal(cloudevent.format());
          }));

      describe("'data' attribute with 'base64' encoding", () => {
        it("the request payload should be correct",
          () => structured.emit(httpcfg, cebase64)
            .then((response) => {
              expect(JSON.parse(response.config.data).data)
                .to.equal(cebase64.format().data);
            }));
      });
    });
  });

  describe("Binary", () => {
    describe("JSON Format", () => {
      it(`requires ${cloudevent.dataContentType} in the header`,
        () => binary.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(cloudevent.dataContentType);
          }));

      it("the request payload should be correct", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(JSON.parse(response.config.data))
            .to.deep.equal(cloudevent.data);
        }));

      it("HTTP Header contains 'ce-type'", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property("ce-type");
        }));

      it("HTTP Header contains 'ce-specversion'", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property("ce-specversion");
        }));

      it("HTTP Header contains 'ce-source'", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property("ce-source");
        }));

      it("HTTP Header contains 'ce-id'", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property("ce-id");
        }));

      it("HTTP Header contains 'ce-time'", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property("ce-time");
        }));

      it("HTTP Header contains 'ce-schemaurl'", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property("ce-schemaurl");
        }));

      it(`HTTP Header contains 'ce-${ext1Name}'`, () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property(`ce-${ext1Name}`);
        }));

      it(`HTTP Header contains 'ce-${ext2Name}'`, () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property(`ce-${ext2Name}`);
        }));

      it("HTTP Header contains 'ce-subject'", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(response.config.headers)
            .to.have.property("ce-subject");
        }));

      it("should 'ce-type' have the right value", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(cloudevent.type)
            .to.equal(response.config.headers["ce-type"]);
        }));

      it("should 'ce-specversion' have the right value",
        () => binary.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(cloudevent.specversion)
              .to.equal(response.config.headers["ce-specversion"]);
          }));

      it("should 'ce-source' have the right value",
        () => binary.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(cloudevent.source)
              .to.equal(response.config.headers["ce-source"]);
          }));

      it("should 'ce-id' have the right value", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(cloudevent.id)
            .to.equal(response.config.headers["ce-id"]);
        }));

      it("should 'ce-time' have the right value", () => binary.emit(httpcfg, cloudevent)
        .then((response) => {
          expect(cloudevent.time)
            .to.equal(response.config.headers["ce-time"]);
        }));

      it("should 'ce-schemaurl' have the right value",
        () => binary.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(cloudevent.schemaURL)
              .to.equal(response.config.headers["ce-schemaurl"]);
          }));

      it(`should 'ce-${ext1Name}' have the right value`,
        () => binary.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(cloudevent.getExtensions()[ext1Name])
              .to.equal(response.config.headers[`ce-${ext1Name}`]);
          }));

      it(`should 'ce-${ext2Name}' have the right value`,
        () => binary.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(cloudevent.getExtensions()[ext2Name])
              .to.equal(response.config.headers[`ce-${ext2Name}`]);
          }));

      it("should 'ce-subject' have the right value",
        () => binary.emit(httpcfg, cloudevent)
          .then((response) => {
            expect(cloudevent.subject)
              .to.equal(response.config.headers["ce-subject"]);
          }));

      describe("'data' attribute with 'base64' encoding", () => {
        it("HTTP Header contains 'ce-datacontentencoding'",
          () => binary.emit(httpcfg, cebase64)
            .then((response) => {
              expect(response.config.headers)
                .to.have.property("ce-datacontentencoding");
            }));

        it("should 'ce-datacontentencoding' have the right value",
          () => binary.emit(httpcfg, cebase64)
            .then((response) => {
              expect(cebase64.dataContentEncoding)
                .to.equal(response.config.headers["ce-datacontentencoding"]);
            }));
      });
    });
  });
});
