const { expect } = require("chai");
const nock = require("nock");

const {
  SPEC_V1,
  SPEC_V03,
  DEFAULT_CE_CONTENT_TYPE,
  BINARY_HEADERS_03,
  BINARY_HEADERS_1
} = require("../../../lib/bindings/http/constants.js");

const { CloudEvent, HTTPEmitter } = require("../../../");

const receiver = "https://cloudevents.io/";
const type = "com.example.test";
const source = "urn:event:from:myapi/resource/123";
const ext1Name = "lunch";
const ext1Value = "tacos";
const ext2Name = "supper";
const ext2Value = "sushi";

const data = {
  lunchBreak: "noon"
};

describe("HTTP Transport Binding Emitter for CloudEvents", () => {
  beforeEach(() => {
    nock(receiver)
      .post("/")
      .reply(function(uri, requestBody) {
        // return the request body and the headers so they can be
        // examined in the test
        if (typeof requestBody === "string") {
          requestBody = JSON.parse(requestBody);
        }
        const returnBody = { ...requestBody, ...this.req.headers };
        return [
          201,
          returnBody
        ];
      });
  });

  describe("V1", () => {
    const emitter = new HTTPEmitter({ url: receiver });
    const event = new CloudEvent({
      specversion: SPEC_V1,
      type,
      source,
      time: new Date(),
      data
    });
    event.addExtension(ext1Name, ext1Value)
    event.addExtension(ext2Name, ext2Value);

    it("Sends a binary 1.0 CloudEvent by default", () => {
      emitter.send(event).then((response) => {
          // A binary message will have a ce-id header
          expect(response.data[BINARY_HEADERS_1.ID]).to.equal(event.id);
          expect(response.data[BINARY_HEADERS_1.SPEC_VERSION]).to.equal(SPEC_V1);
          // A binary message will have a request body for the data
          expect(response.data.lunchBreak).to.equal(data.lunchBreak);
      }).catch(expect.fail);
    });

    it("Provides the HTTP headers for a binary event", () => {
      const headers = HTTPEmitter.headers(event);
      expect(headers[BINARY_HEADERS_1.TYPE]).to.equal(event.type);
      expect(headers[BINARY_HEADERS_1.SPEC_VERSION]).to.equal(event.specversion);
      expect(headers[BINARY_HEADERS_1.SOURCE]).to.equal(event.source);
      expect(headers[BINARY_HEADERS_1.ID]).to.equal(event.id);
      expect(headers[BINARY_HEADERS_1.TIME]).to.equal(event.time);
    });

    it("Sends a structured 1.0 CloudEvent if specified", () => {
      emitter.send(event, { mode: "structured" })
        .then((response) => {
          // A structured message will have a cloud event content type
          expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
          // Ensure other CE headers don't exist - just testing for ID
          expect(response.data[BINARY_HEADERS_1.ID]).to.equal(undefined);
          // The spec version would have been specified in the body
          expect(response.data.specversion).to.equal(SPEC_V1);
          expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
        }).catch(expect.fail);
    });

    it("Sends to an alternate URL if specified", () => {
      nock(receiver)
        .post("/alternate")
        .reply(function(uri, requestBody) {
          // return the request body and the headers so they can be
          // examined in the test
          if (typeof requestBody === "string") {
            requestBody = JSON.parse(requestBody);
          }
          const returnBody = { ...requestBody, ...this.req.headers };
          return [
            201,
            returnBody
          ];
        });

      emitter.send(event, { mode: "structured", url: `${receiver}alternate` })
        .then((response) => {
          // A structured message will have a cloud event content type
          expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
          // Ensure other CE headers don't exist - just testing for ID
          expect(response.data[BINARY_HEADERS_1.ID]).to.equal(undefined);
          // The spec version would have been specified in the body
          expect(response.data.specversion).to.equal(SPEC_V1);
          expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
        }).catch(expect.fail);
    });
  });

  describe("V03", () => {
    const emitter = new HTTPEmitter({ url: receiver, version: SPEC_V03 });
    const event = new CloudEvent({
      specversion: SPEC_V03,
      type,
      source,
      time: new Date(),
      data
    });
    event.addExtension(ext1Name, ext1Value)
    event.addExtension(ext2Name, ext2Value);

    it("Sends a binary 0.3 CloudEvent", () => {
      emitter.send(event).then((response) => {
        // A binary message will have a ce-id header
        expect(response.data[BINARY_HEADERS_03.ID]).to.equal(event.id);
        expect(response.data[BINARY_HEADERS_03.SPEC_VERSION]).to.equal(SPEC_V03);
        // A binary message will have a request body for the data
        expect(response.data.lunchBreak).to.equal(data.lunchBreak);
      }).catch(expect.fail);
    });

    it("Provides the HTTP headers for a binary event", () => {
      const headers = HTTPEmitter.headers(event, SPEC_V03);
      expect(headers[BINARY_HEADERS_03.TYPE]).to.equal(event.type);
      expect(headers[BINARY_HEADERS_03.SPEC_VERSION]).to.equal(event.specversion);
      expect(headers[BINARY_HEADERS_03.SOURCE]).to.equal(event.source);
      expect(headers[BINARY_HEADERS_03.ID]).to.equal(event.id);
      expect(headers[BINARY_HEADERS_03.TIME]).to.equal(event.time);
    });

    it("Sends a structured 0.3 CloudEvent if specified", () => {
      emitter.send(event, { mode: "structured", foo: "bar" })
        .then((response) => {
          // A structured message will have a cloud event content type
          expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
          // Ensure other CE headers don't exist - just testing for ID
          expect(response.data[BINARY_HEADERS_03.ID]).to.equal(undefined);
          // The spec version would have been specified in the body
          expect(response.data.specversion).to.equal(SPEC_V03);
          expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
        }).catch(expect.fail);
    });

    it("Sends to an alternate URL if specified", () => {
      nock(receiver)
        .post("/alternate")
        .reply(function(uri, requestBody) {
          // return the request body and the headers so they can be
          // examined in the test
          if (typeof requestBody === "string") {
            requestBody = JSON.parse(requestBody);
          }
          const returnBody = { ...requestBody, ...this.req.headers };
          return [
            201,
            returnBody
          ];
        });

      emitter.send(event, { mode: "structured", url: `${receiver}alternate` })
        .then((response) => {
          // A structured message will have a cloud event content type
          expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
          // Ensure other CE headers don't exist - just testing for ID
          expect(response.data[BINARY_HEADERS_03.ID]).to.equal(undefined);
          // The spec version would have been specified in the body
          expect(response.data.specversion).to.equal(SPEC_V03);
          expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
        }).catch(expect.fail);
    });
  });
});
