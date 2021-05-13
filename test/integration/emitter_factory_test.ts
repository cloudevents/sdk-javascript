/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import nock from "nock";
import axios from "axios";
import request from "superagent";
import got from "got";

import CONSTANTS from "../../src/constants";
import { CloudEvent, emitterFor, HTTP, Mode, Message, Options, TransportFunction } from "../../src";

const DEFAULT_CE_CONTENT_TYPE = CONSTANTS.DEFAULT_CE_CONTENT_TYPE;
const sink = "https://cloudevents.io/";
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

export const fixture = new CloudEvent({
  source,
  type,
  data,
  [ext1Name]: ext1Value,
  [ext2Name]: ext2Value,
  [ext3Name]: ext3Value,
});

function axiosEmitter(message: Message, options?: Options): Promise<unknown> {
  return axios.post(sink, message.body, { headers: message.headers, ...options });
}

function superagentEmitter(message: Message, options?: Options): Promise<unknown> {
  const post = request.post(sink);
  // set any provided options
  if (options) {
    for (const key of Object.getOwnPropertyNames(options)) {
      if (options[key]) {
        post.set(key, options[key] as string);
      }
    }
  }
  // set headers
  for (const key of Object.getOwnPropertyNames(message.headers)) {
    post.set(key, message.headers[key] as string);
  }
  return post.send(message.body as string);
}

function gotEmitter(message: Message, options?: Options): Promise<unknown> {
  return Promise.resolve(
    got.post(sink, { headers: message.headers, body: message.body as string, ...((options as unknown) as Options) }),
  );
}

describe("emitterFor() defaults", () => {
  it("Defaults to HTTP binding, binary mode", () => {
    function transport(message: Message): Promise<unknown> {
      // A binary message will have the source attribute as a header
      expect(message.headers[CONSTANTS.CE_HEADERS.TYPE]).to.equal("emitter.test");
      return Promise.resolve();
    }
    const emitter = emitterFor(transport);
    emitter(
      new CloudEvent({
        id: "1234",
        source: "/emitter/test",
        type: "emitter.test",
      }),
    );
  });

  it("Supports HTTP binding, structured mode", () => {
    function transport(message: Message): Promise<unknown> {
      console.error(message);
      // A structured message will have the application/cloudevents+json header
      expect(message.headers["content-type"]).to.equal(CONSTANTS.DEFAULT_CE_CONTENT_TYPE);
      const body = JSON.parse(message.body as string);
      expect(body.id).to.equal("1234");
      return Promise.resolve();
    }
    // Ignore the next line to ensure that HTTP transport is still the default.
    // Otherwise, tslint would complain that the param did not have `binding: <val>`
    /* @ts-ignore */
    const emitter = emitterFor(transport, { mode: Mode.STRUCTURED });
    emitter(
      new CloudEvent({
        id: "1234",
        source: "/emitter/test",
        type: "emitter.test",
      }),
    );
  });
});

describe("HTTP Transport Binding for emitterFactory", () => {
  beforeEach(() => {
    nock(sink)
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

  describe("Axios", () => {
    testEmitter(axiosEmitter, "data");
  });
  describe("SuperAgent", () => {
    testEmitter(superagentEmitter, "body");
  });
  describe("Got", () => {
    testEmitter(gotEmitter, "body");
  });
});

function testEmitter(fn: TransportFunction, bodyAttr: string) {
  it("Works as a binary event emitter", async () => {
    const emitter = emitterFor(fn);
    const response = (await emitter(fixture)) as Record<string, Record<string, string>>;
    let body = response[bodyAttr];
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    assertBinary(body);
  });

  it("Works as a structured event emitter", async () => {
    const emitter = emitterFor(fn, { binding: HTTP, mode: Mode.STRUCTURED });
    const response = (await emitter(fixture)) as Record<string, Record<string, Record<string, string>>>;
    let body = response[bodyAttr];
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    assertStructured(body);
  });
}

/**
 * Verify the received binary answer compare to the original fixture message
 *
 * @param {Record<string, Record<string, string>>} response received to compare to fixture
 * @return {void} void
 */
export function assertBinary(response: Record<string, string>): void {
  expect(response.lunchBreak).to.equal(data.lunchBreak);
  expect(response["ce-type"]).to.equal(type);
  expect(response["ce-source"]).to.equal(source);
  expect(response[`ce-${ext1Name}`]).to.deep.equal(ext1Value);
  expect(response[`ce-${ext2Name}`]).to.deep.equal(ext2Value);
  expect(response[`ce-${ext3Name}`]).to.deep.equal(ext3Value);
}

/**
 * Verify the received structured answer compare to the original fixture message
 *
 * @param {Record<string, Record<string, string>>} response received to compare to fixture
 * @return {void} void
 */
export function assertStructured(response: Record<string, Record<string, string>>): void {
  expect(response.data.lunchBreak).to.equal(data.lunchBreak);
  expect(response.type).to.equal(type);
  expect(response.source).to.equal(source);
  expect(response["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
  expect(response[ext1Name]).to.deep.equal(ext1Value);
  expect(response[ext2Name]).to.deep.equal(ext2Value);
  expect(response[ext3Name]).to.deep.equal(ext3Value);
}
