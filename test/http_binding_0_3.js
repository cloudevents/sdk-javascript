const expect = require("chai").expect;
const nock = require("nock");
const http = require("http");
const request = require("request");
const BinaryHTTPEmitter =
  require("../lib/bindings/http/emitter_binary_0_3.js");
const Cloudevent = require("../lib/cloudevent.js");
const v03 = require("../v03/index.js");

const type        = "com.github.pull.create";
const source      = "urn:event:from:myapi/resourse/123";
const contentEncoding = "base64";
const contentType = "application/cloudevents+json; charset=utf-8";
const now         = new Date();
const schemaurl   = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};
const dataBase64 = "Y2xvdWRldmVudHMK";

const ext1Name  = "extension1";
const ext1Value = "foobar";
const ext2Name  = "extension2";
const ext2Value = "acme";

const cloudevent =
  new Cloudevent(v03.Spec)
    .type(type)
    .source(source)
    .dataContentType(ceContentType)
    .subject("subject.ext")
    .time(now)
    .schemaurl(schemaurl)
    .data(data)
    .addExtension(ext1Name, ext1Value)
    .addExtension(ext2Name, ext2Value);

const cebase64 =
  new Cloudevent(v03.Spec)
    .type(type)
    .source(source)
    .dataContentType(ceContentType)
    .dataContentEncoding(contentEncoding)
    .time(now)
    .schemaurl(schemaurl)
    .data(dataBase64)
    .addExtension(ext1Name, ext1Value)
    .addExtension(ext2Name, ext2Value);


const webhook = "https://cloudevents.io/webhook";
const httpcfg = {
  method : "POST",
  url    : webhook + "/json"
};

const binary = new BinaryHTTPEmitter(httpcfg);
const structured = new v03.StructuredHTTPEmitter(httpcfg);

describe("HTTP Transport Binding - Version 0.3", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook)
      .post("/json")
      .reply(201, {status: "accepted"});
  });

  describe("Structured", () => {
    describe("JSON Format", () => {
      it("requires '" + contentType + "' Content-Type in the header", () => {
        return structured.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(contentType);
          });
      });

      it("the request payload should be correct", () => {
        return structured.emit(cloudevent)
          .then((response) => {
            expect(JSON.parse(response.config.data))
              .to.deep.equal(cloudevent.format());
          });
      });

      describe("'data' attribute with 'base64' encoding", () => {
        it("the request payload should be correct", () => {
          return structured.emit(cebase64)
            .then((response) => {
              expect(JSON.parse(response.config.data).data)
                .to.equal(cebase64.format().data);
            });
        });
      });
    });
  });

  describe("Binary", () => {
    describe("JSON Format", () => {
      it("requires '" + cloudevent.getDataContentType() + "' Content-Type in the header", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers["Content-Type"])
              .to.equal(cloudevent.getDataContentType());
          });
      });

      it("the request payload should be correct", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(JSON.parse(response.config.data))
              .to.deep.equal(cloudevent.getData());
          });
      });

      it("HTTP Header contains 'ce-type'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-type");
          });
      });

      it("HTTP Header contains 'ce-specversion'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-specversion");
          });
      });

      it("HTTP Header contains 'ce-source'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-source");
          });
      });

      it("HTTP Header contains 'ce-id'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-id");
          });
      });

      it("HTTP Header contains 'ce-time'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-time");
          });
      });

      it("HTTP Header contains 'ce-schemaurl'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-schemaurl");
          });
      });

      it("HTTP Header contains 'ce-" + ext1Name + "'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-" + ext1Name);
          });
      });

      it("HTTP Header contains 'ce-" + ext2Name + "'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-" + ext2Name);
          });
      });

      it("HTTP Header contains 'ce-subject'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-subject");
          });
      });

      describe("'data' attribute with 'base64' encoding", () => {
        it("HTTP Header contains 'ce-datacontentencoding'", () => {
          return binary.emit(cebase64)
            .then((response) => {
              expect(response.config.headers)
                .to.have.property("ce-datacontentencoding");
            });
        });
      });
    });
  });

});
