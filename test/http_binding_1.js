const expect = require("chai").expect;
const nock = require("nock");
const http = require("http");
const request = require("request");
const {asBase64} = require("../lib/utils/fun.js");

const BinaryHTTPEmitter =
  require("../lib/bindings/http/emitter_binary_1.js");
const Cloudevent = require("../lib/cloudevent.js");

const v1 = require("../v1/index.js");

const type        = "com.github.pull.create";
const source      = "urn:event:from:myapi/resourse/123";
const contentType = "application/cloudevents+json; charset=utf-8";
const now         = new Date();
const dataschema  = "http://cloudevents.io/schema.json";

const ceContentType = "application/json";

const data = {
  foo: "bar"
};

const ext1Name  = "extension1";
const ext1Value = "foobar";
const ext2Name  = "extension2";
const ext2Value = "acme";

const cloudevent =
  new Cloudevent(v1.Spec)
    .type(type)
    .source(source)
    .dataContentType(ceContentType)
    .subject("subject.ext")
    .time(now)
    .dataschema(dataschema)
    .data(data)
    .addExtension(ext1Name, ext1Value)
    .addExtension(ext2Name, ext2Value);

const dataString = ")(*~^my data for ce#@#$%"

const webhook = "https://cloudevents.io/webhook/v1";
const httpcfg = {
  method : "POST",
  url    : webhook + "/json"
};

const binary = new BinaryHTTPEmitter(httpcfg);
const structured = new v1.StructuredHTTPEmitter(httpcfg);

describe("HTTP Transport Binding - Version 1.0", () => {
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

      describe("Binary event data", () => {
        it("the request payload should be correct when data is binary", () => {
          let bindata = Uint32Array.from(dataString, (c) => c.codePointAt(0));
          let expected = asBase64(bindata);
          let binevent =
            new Cloudevent(v1.Spec)
              .type(type)
              .source(source)
              .dataContentType("text/plain")
              .data(bindata)
              .addExtension(ext1Name, ext1Value)
              .addExtension(ext2Name, ext2Value);

          return structured.emit(binevent)
            .then((response) => {
              expect(JSON.parse(response.config.data).data_base64)
                .to.equal(expected);
            });
        });

        it("the payload must have 'data_base64' when data is binary", () => {
          let binevent =
            new Cloudevent(v1.Spec)
              .type(type)
              .source(source)
              .dataContentType("text/plain")
              .data(Uint32Array.from(dataString, (c) => c.codePointAt(0)))
              .addExtension(ext1Name, ext1Value)
              .addExtension(ext2Name, ext2Value);

          return structured.emit(binevent)
            .then((response) => {
              expect(JSON.parse(response.config.data))
                .to.have.property("data_base64");
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

      it("the request payload should be correct when event data is binary", () => {
        let bindata = Uint32Array.from(dataString, (c) => c.codePointAt(0));
        let expected = asBase64(bindata);
        let binevent =
          new Cloudevent(v1.Spec)
            .type(type)
            .source(source)
            .dataContentType("text/plain")
            .data(bindata)
            .addExtension(ext1Name, ext1Value)
            .addExtension(ext2Name, ext2Value);

        return binary.emit(binevent)
          .then((response) => {
            expect(response.config.data)
              .to.equal(expected);
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

      it("HTTP Header contains 'ce-dataschema'", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(response.config.headers)
              .to.have.property("ce-dataschema");
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

      it("should 'ce-type' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getType())
              .to.equal(response.config.headers["ce-type"]);
          });
      });

      it("should 'ce-specversion' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getSpecversion())
              .to.equal(response.config.headers["ce-specversion"]);
          });
      });

      it("should 'ce-source' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getSource())
              .to.equal(response.config.headers["ce-source"]);
          });
      });

      it("should 'ce-id' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getId())
              .to.equal(response.config.headers["ce-id"]);
          });
      });

      it("should 'ce-time' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getTime())
              .to.equal(response.config.headers["ce-time"]);
          });
      });

      it("should 'ce-dataschema' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getDataschema())
              .to.equal(response.config.headers["ce-dataschema"]);
          });
      });

      it("should 'ce-" + ext1Name + "' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getExtensions()[ext1Name])
              .to.equal(response.config.headers["ce-" + ext1Name]);
          });
      });

      it("should 'ce-" + ext2Name + "' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getExtensions()[ext2Name])
              .to.equal(response.config.headers["ce-" + ext2Name]);
          });
      });

      it("should 'ce-subject' have the right value", () => {
        return binary.emit(cloudevent)
          .then((response) => {
            expect(cloudevent.getSubject())
              .to.equal(response.config.headers["ce-subject"]);
          });
      });
    });
  });
});
