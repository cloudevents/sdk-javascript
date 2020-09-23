import "mocha";
import { expect } from "chai";
import nock from "nock";
import axios from "axios";
import request from "superagent";
import got from "got";

import CONSTANTS from "../../src/constants";
import { CloudEvent, emitterFactory, HTTP, Mode, Message, Options, TransportFunction } from "../../src";

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

const fixture = new CloudEvent({
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
    post.set(key, message.headers[key]);
  }
  return post.send(message.body);
}

function gotEmitter(message: Message, options?: Options): Promise<unknown> {
  return Promise.resolve(
    got.post(sink, { headers: message.headers, body: message.body, ...((options as unknown) as Options) }),
  );
}

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
    const emitter = emitterFactory(HTTP, Mode.BINARY, fn);
    const response = (await emitter(fixture)) as Record<string, Record<string, string>>;
    let body = response[bodyAttr];
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    assertBinary(body);
  });

  it("Works as a structured event emitter", async () => {
    const emitter = emitterFactory(HTTP, Mode.STRUCTURED, fn);
    const response = (await emitter(fixture)) as Record<string, Record<string, Record<string, string>>>;
    let body = response[bodyAttr];
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    assertStructured(body);
  });
}

function assertBinary(response: Record<string, string>) {
  expect(response.lunchBreak).to.equal(data.lunchBreak);
  expect(response["ce-type"]).to.equal(type);
  expect(response["ce-source"]).to.equal(source);
  expect(response[`ce-${ext1Name}`]).to.deep.equal(ext1Value);
  expect(response[`ce-${ext2Name}`]).to.deep.equal(ext2Value);
  expect(response[`ce-${ext3Name}`]).to.deep.equal(ext3Value);
}

function assertStructured(response: Record<string, Record<string, string>>) {
  expect(response.data.lunchBreak).to.equal(data.lunchBreak);
  expect(response.type).to.equal(type);
  expect(response.source).to.equal(source);
  expect(response["content-type"]).to.equal(DEFAULT_CE_CONTENT_TYPE);
  expect(response[ext1Name]).to.deep.equal(ext1Value);
  expect(response[ext2Name]).to.deep.equal(ext2Value);
  expect(response[ext3Name]).to.deep.equal(ext3Value);
}
