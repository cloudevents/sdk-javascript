import "mocha";
import { expect } from "chai";
import nock from "nock";
import CONSTANTS from "../../src/constants";

const DEFAULT_CE_CONTENT_TYPE = CONSTANTS.DEFAULT_CE_CONTENT_TYPE;
const DEFAULT_CONTENT_TYPE = CONSTANTS.DEFAULT_CONTENT_TYPE;

import { CloudEvent, Version, Emitter, Protocol } from "../../src";
import { headersFor } from "../../src/messages/http/headers";
import { AxiosResponse } from "axios";

const receiver = "https://cloudevents.io/";
const type = "com.example.test";
const source = "urn:event:from:myapi/resource/123";
const ext1Name = "lunch";
const ext1Value = "tacos";
const ext2Name = "supper";
const ext2Value = "sushi";
const ext3Name = "snack";
const ext3Value = { value: "chips" };

const data = {
  lunchBreak: "noon",
};

describe("HTTP Transport Binding Emitter for CloudEvents", () => {
  beforeEach(() => {
    nock(receiver)
      .post("/")

      .reply(function (uri: string, body: nock.Body) {
        // return the request body and the headers so they can be
        // examined in the test
        if (typeof body === "string") {
          body = JSON.parse(body);
        }
        const returnBody = { ...(body as Record<string, unknown>), ...this.req.headers };
        return [201, returnBody];
      });
  });

  describe("V1", () => {
    const emitter = new Emitter({ url: receiver });
    const event = new CloudEvent({
      type,
      source,
      time: new Date(),
      data,
      [ext1Name]: ext1Value,
      [ext2Name]: ext2Value,
      [ext3Name]: ext3Value,
    });

    it("Sends a binary 1.0 CloudEvent by default", () =>
      emitter
        .send(event)
        .then((response: AxiosResponse) => {
          // A binary message will have a ce-id header
          expect(response.data["content-type"]).to.equal(DEFAULT_CONTENT_TYPE);
          expect(response.data[CONSTANTS.CE_HEADERS.ID]).to.equal(event.id);
          expect(response.data[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(Version.V1);
          // A binary message will have a request body for the data
          expect(response.data.lunchBreak).to.equal(data.lunchBreak);
          // Ensure extensions are handled properly
          expect(response.data[`${CONSTANTS.EXTENSIONS_PREFIX}${ext1Name}`]).to.equal(ext1Value);
          expect(response.data[`${CONSTANTS.EXTENSIONS_PREFIX}${ext2Name}`]).to.equal(ext2Value);
          expect(response.data[`${CONSTANTS.EXTENSIONS_PREFIX}${ext3Name}`].value).to.equal(ext3Value.value);
        })
        .catch(expect.fail));

    it("Provides the HTTP headers for a binary event", () => {
      const headers = headersFor(event);
      expect(headers[CONSTANTS.CE_HEADERS.TYPE]).to.equal(event.type);
      expect(headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(event.specversion);
      expect(headers[CONSTANTS.CE_HEADERS.SOURCE]).to.equal(event.source);
      expect(headers[CONSTANTS.CE_HEADERS.ID]).to.equal(event.id);
      expect(headers[CONSTANTS.CE_HEADERS.TIME]).to.equal(event.time);
    });

    it("Sends a binary CloudEvent with Custom Headers", () =>
      emitter
        .send(event, { headers: { customheader: "value" } })
        .then((response: { data: { [k: string]: string } }) => {
          // A binary message will have a ce-id header
          expect(response.data.customheader).to.equal("value");
          expect(response.data["content-type"]).to.equal(DEFAULT_CONTENT_TYPE);
          expect(response.data[CONSTANTS.CE_HEADERS.ID]).to.equal(event.id);
          expect(response.data[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(Version.V1);
          // A binary message will have a request body for the data
          expect(response.data.lunchBreak).to.equal(data.lunchBreak);
        })
        .catch(expect.fail));

    it("Sends a structured 1.0 CloudEvent if specified", () =>
      emitter
        .send(event, { protocol: Protocol.HTTPStructured })
        .then((response: { data: { [k: string]: string | Record<string, string>; data: { lunchBreak: string } } }) => {
          // A structured message will have a cloud event content type
          expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
          // Ensure other CE headers don't exist - just testing for ID
          expect(response.data[CONSTANTS.CE_HEADERS.ID]).to.equal(undefined);
          // The spec version would have been specified in the body
          expect(response.data.specversion).to.equal(Version.V1);
          expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
          // Ensure extensions are handled properly
          expect(response.data[ext1Name]).to.equal(ext1Value);
          expect(response.data[ext2Name]).to.equal(ext2Value);
        })
        .catch(expect.fail));

    it("Sends to an alternate URL if specified", () => {
      nock(receiver)
        .post("/alternate")
        .reply(function (uri, requestBody: nock.Body) {
          // return the request body and the headers so they can be
          // examined in the test
          if (typeof requestBody === "string") {
            requestBody = JSON.parse(requestBody);
          }
          const returnBody = { ...(requestBody as Record<string, unknown>), ...this.req.headers };
          return [201, returnBody];
        });

      return emitter
        .send(event, { protocol: Protocol.HTTPStructured, url: `${receiver}alternate` })
        .then((response: AxiosResponse) => {
          // A structured message will have a cloud event content type
          expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
          // Ensure other CE headers don't exist - just testing for ID
          expect(response.data[CONSTANTS.CE_HEADERS.ID]).to.equal(undefined);
          // The spec version would have been specified in the body
          expect(response.data.specversion).to.equal(Version.V1);
          expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
        })
        .catch(expect.fail);
    });
  });

  describe("V03", () => {
    const emitter = new Emitter({ url: receiver });
    const event = new CloudEvent({
      specversion: Version.V03,
      type,
      source,
      time: new Date(),
      data,
      [ext1Name]: ext1Value,
      [ext2Name]: ext2Value,
      [ext3Name]: ext3Value,
    });

    it("Sends a binary 0.3 CloudEvent", () =>
      emitter
        .send(event)
        .then((response: AxiosResponse) => {
          // A binary message will have a ce-id header
          expect(response.data[CONSTANTS.CE_HEADERS.ID]).to.equal(event.id);
          expect(response.data[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(Version.V03);
          // A binary message will have a request body for the data
          expect(response.data.lunchBreak).to.equal(data.lunchBreak);
          // Ensure extensions are handled properly
          expect(response.data[`${CONSTANTS.EXTENSIONS_PREFIX}${ext1Name}`]).to.equal(ext1Value);
          expect(response.data[`${CONSTANTS.EXTENSIONS_PREFIX}${ext2Name}`]).to.equal(ext2Value);
          expect(response.data[`${CONSTANTS.EXTENSIONS_PREFIX}${ext3Name}`].value).to.equal(ext3Value.value);
        })
        .catch(expect.fail));

    it("Provides the HTTP headers for a binary event", () => {
      const headers = headersFor(event);
      expect(headers[CONSTANTS.CE_HEADERS.TYPE]).to.equal(event.type);
      expect(headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(event.specversion);
      expect(headers[CONSTANTS.CE_HEADERS.SOURCE]).to.equal(event.source);
      expect(headers[CONSTANTS.CE_HEADERS.ID]).to.equal(event.id);
      expect(headers[CONSTANTS.CE_HEADERS.TIME]).to.equal(event.time);
    });

    it("Sends a structured 0.3 CloudEvent if specified", () =>
      emitter
        .send(event, { protocol: Protocol.HTTPStructured })
        .then(
          (response: {
            data: { [k: string]: string | Record<string, string>; specversion: string; data: { lunchBreak: string } };
          }) => {
            // A structured message will have a cloud event content type
            expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
            // Ensure other CE headers don't exist - just testing for ID
            expect(response.data[CONSTANTS.CE_HEADERS.ID]).to.equal(undefined);
            // The spec version would have been specified in the body
            expect(response.data.specversion).to.equal(Version.V03);
            expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
            // Ensure extensions are handled properly
            expect(response.data[ext1Name]).to.equal(ext1Value);
            expect(response.data[ext2Name]).to.equal(ext2Value);
          },
        )
        .catch(expect.fail));

    it("Sends to an alternate URL if specified", () => {
      nock(receiver)
        .post("/alternate")
        .reply(function (uri, requestBody: nock.Body) {
          // return the request body and the headers so they can be
          // examined in the test
          if (typeof requestBody === "string") {
            requestBody = JSON.parse(requestBody);
          }
          const returnBody = { ...(requestBody as Record<string, unknown>), ...this.req.headers };
          return [201, returnBody];
        });

      return emitter
        .send(event, { protocol: Protocol.HTTPStructured, url: `${receiver}alternate` })
        .then(
          (response: {
            data: { specversion: string; data: { lunchBreak: string }; [k: string]: string | Record<string, string> };
          }) => {
            // A structured message will have a cloud event content type
            expect(response.data["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
            // Ensure other CE headers don't exist - just testing for ID
            expect(response.data[CONSTANTS.CE_HEADERS.ID]).to.equal(undefined);
            // The spec version would have been specified in the body
            expect(response.data.specversion).to.equal(Version.V03);
            expect(response.data.data.lunchBreak).to.equal(data.lunchBreak);
          },
        )
        .catch(expect.fail);
    });
  });
});
