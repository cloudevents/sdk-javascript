const expect = require("chai").expect;
const nock = require("nock");
const https = require("https");
const { asBase64 } = require("../lib/bindings/http/validation/fun.js");
const { SPEC_V1 } = require("../lib/bindings/http/constants.js");
const { CloudEvent } = require("../");
const BinaryHTTPEmitter = require("../lib/bindings/http/emitter_binary.js");
const StructuredHTTPEmitter = require("../lib/bindings/http/emitter_structured.js");
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resource/123";
const contentType = "application/cloudevents+json; charset=utf-8";
const time = new Date();
const subject = "subject.ext";
const dataSchema = "http://cloudevents.io/schema.json";

const dataContentType = "application/json";

const data = {
  foo: "bar"
};

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

const cloudevent = new CloudEvent({
  specversion: SPEC_V1,
  type,
  source,
  dataContentType,
  subject,
  time,
  dataSchema,
  data
});
cloudevent.addExtension(ext1Name, ext1Value);
cloudevent.addExtension(ext2Name, ext2Value);

const dataString = ")(*~^my data for ce#@#$%";

const webhook = "https://cloudevents.io/webhook/v1";
const httpcfg = {
  method: "POST",
  url: `${webhook}/json`
};

const binary = new BinaryHTTPEmitter(SPEC_V1);
const structured = new StructuredHTTPEmitter();

describe("HTTP Transport Binding - Version 1.0", () => {
  beforeEach(() => {
    // Mocking the webhook
    nock(webhook)
      .post("/json")
      .reply(201, { status: "accepted" });
  });

  describe("Structured", () => {
    it("works with mTLS authentication", () => {
      const event = new StructuredHTTPEmitter({
        method: "POST",
        url: `${webhook}/json`,
        httpsAgent: new https.Agent({
          cert: "some value",
          key: "other value"
        })
      });
      return event.emit(httpcfg, cloudevent).then((response) => {
        expect(response.config.headers["Content-Type"])
          .to.equal(contentType);
      });
    });

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

      describe("Binary event data", () => {
        it("the request payload should be correct when data is binary", () => {
          const bindata = Uint32Array.from(dataString, (c) => c.codePointAt(0));
          const expected = asBase64(bindata);
          const binevent = new CloudEvent({
            type,
            source,
            dataContentType: "text/plain",
            data: bindata,
          });
          binevent.addExtension(ext1Name, ext1Value);
          binevent.addExtension(ext2Name, ext2Value);

          return structured.emit(httpcfg, binevent)
            .then((response) => {
              expect(JSON.parse(response.config.data).data_base64)
                .to.equal(expected);
            });
        });

        it("the payload must have 'data_base64' when data is binary", () => {
          const binevent = new CloudEvent({
            type,
            source,
            dataContentType: "text/plain",
            data: Uint32Array.from(dataString, (c) => c.codePointAt(0)),
          });
          binevent.addExtension(ext1Name, ext1Value);
          binevent.addExtension(ext2Name, ext2Value);

          return structured.emit(httpcfg, binevent)
            .then((response) => {
              expect(JSON.parse(response.config.data))
                .to.have.property("data_base64");
            });
        });
      });
    });
  });

//   describe("Binary", () => {
//     it("works with mTLS authentication", () =>
//       binary.emit({
//         method: "POST",
//         url: `${webhook}/json`,
//         httpsAgent: new https.Agent({
//           cert: "some value",
//           key: "other value"
//         })
//       }, cloudevent).then((response) => {
//         expect(response.config.headers["Content-Type"])
//           .to.equal(cloudevent.dataContentType);
//       })
//     );

//     describe("JSON Format", () => {
//       it(`requires '${cloudevent.dataContentType}' in the header`,
//         () => binary.emit(httpcfg, cloudevent)
//           .then((response) => {
//             expect(response.config.headers["Content-Type"])
//               .to.equal(cloudevent.dataContentType);
//           }));

//       it("the request payload should be correct", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(JSON.parse(response.config.data))
//             .to.deep.equal(cloudevent.data);
//         }));

//       it("the request payload should be correct when event data is binary", () => {
//         const bindata = Uint32Array.from(dataString, (c) => c.codePointAt(0));
//         const expected = asBase64(bindata);
//         const binevent = new CloudEvent({
//           type,
//           source,
//           dataContentType: "text/plain",
//           data: bindata,
//         });
//         binevent.addExtension(ext1Name, ext1Value);
//         binevent.addExtension(ext2Name, ext2Value);

//         return binary.emit(httpcfg, binevent)
//           .then((response) => {
//             expect(response.config.data)
//               .to.equal(expected);
//           });
//       });

//       it("HTTP Header contains 'ce-type'", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property("ce-type");
//         }));

//       it("HTTP Header contains 'ce-specversion'", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property("ce-specversion");
//         }));

//       it("HTTP Header contains 'ce-source'", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property("ce-source");
//         }));

//       it("HTTP Header contains 'ce-id'", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property("ce-id");
//         }));

//       it("HTTP Header contains 'ce-time'", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property("ce-time");
//         }));

//       it("HTTP Header contains 'ce-dataschema'", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property("ce-dataschema");
//         }));

//       it(`HTTP Header contains 'ce-${ext1Name}'`, () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property(`ce-${ext1Name}`);
//         }));

//       it(`HTTP Header contains 'ce-${ext2Name}'`, () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property(`ce-${ext2Name}`);
//         }));

//       it("HTTP Header contains 'ce-subject'", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(response.config.headers)
//             .to.have.property("ce-subject");
//         }));

//       it("should 'ce-type' have the right value", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(cloudevent.type)
//             .to.equal(response.config.headers["ce-type"]);
//         }));

//       it("should 'ce-specversion' have the right value",
//         () => binary.emit(httpcfg, cloudevent)
//           .then((response) => {
//             expect(cloudevent.specversion)
//               .to.equal(response.config.headers["ce-specversion"]);
//           }));

//       it("should 'ce-source' have the right value",
//         () => binary.emit(httpcfg, cloudevent)
//           .then((response) => {
//             expect(cloudevent.source)
//               .to.equal(response.config.headers["ce-source"]);
//           }));

//       it("should 'ce-id' have the right value", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(cloudevent.id)
//             .to.equal(response.config.headers["ce-id"]);
//         }));

//       it("should 'ce-time' have the right value", () => binary.emit(httpcfg, cloudevent)
//         .then((response) => {
//           expect(cloudevent.time)
//             .to.equal(response.config.headers["ce-time"]);
//         }));

//       it("should 'ce-dataschema' have the right value",
//         () => binary.emit(httpcfg, cloudevent)
//           .then((response) => {
//             expect(cloudevent.dataSchema)
//               .to.equal(response.config.headers["ce-dataschema"]);
//           }));

//       it(`should 'ce-${ext1Name}' have the right value`,
//         () => binary.emit(httpcfg, cloudevent)
//           .then((response) => {
//             expect(cloudevent.getExtensions()[ext1Name])
//               .to.equal(response.config.headers[`ce-${ext1Name}`]);
//           }));

//       it(`should 'ce-${ext2Name}' have the right value`,
//         () => binary.emit(httpcfg, cloudevent)
//           .then((response) => {
//             expect(cloudevent.getExtensions()[ext2Name])
//               .to.equal(response.config.headers[`ce-${ext2Name}`]);
//           }));

//       it("should 'ce-subject' have the right value",
//         () => binary.emit(httpcfg, cloudevent)
//           .then((response) => {
//             expect(cloudevent.subject)
//               .to.equal(response.config.headers["ce-subject"]);
//           }));
//     });
//   });
});
