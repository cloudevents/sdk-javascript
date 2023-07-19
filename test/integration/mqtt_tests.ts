/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import path from "path";
import fs from "fs";

import { expect } from "chai";
import { CloudEvent, CONSTANTS, V1, Headers } from "../../src";
import { asBase64 } from "../../src/event/validation";
import { Message, MQTT, MQTTMessage } from "../../src/message";

const type = "org.cncf.cloudevents.example";
const source = "urn:event:from:myapi/resource/123";
const time = new Date().toISOString();
const subject = "subject.ext";
const dataschema = "http://cloudevents.io/schema.json";
const datacontenttype = "application/json";
const id = "b46cf653-d48a-4b90-8dfa-355c01061361";

interface Idata {
  foo: string
}
const data: Idata = {
  foo: "bar",
};

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

// Binary data as base64
const dataBinary = Uint8Array.from(JSON.stringify(data), (c) => c.codePointAt(0) as number);
const data_base64 = asBase64(dataBinary);

// Since the above is a special case (string as binary), let's test
// with a real binary file one is likely to encounter in the wild
const imageData = new Uint8Array(fs.readFileSync(path.join(process.cwd(), "test", "integration", "ce.png")));
const image_base64 = asBase64(imageData);

const PUBLISH = {"Content Type": "application/json; charset=utf-8"};

const fixture = new CloudEvent({
  specversion: V1,
  id,
  type,
  source,
  datacontenttype,
  subject,
  time,
  dataschema,
  data,
  [ext1Name]: ext1Value,
  [ext2Name]: ext2Value,
});

describe("MQTT transport", () => {
  it("Handles events with no content-type and no datacontenttype", () => {
    const payload = "{Something[Not:valid}JSON";
    const userProperties = fixture.toJSON() as Headers;
    const message: MQTTMessage<string> = {
      PUBLISH: undefined, // no Content Type applied
      payload,
      "User Properties": userProperties,
      headers: userProperties,
      body: payload,
    };
    const event = MQTT.toEvent(message) as CloudEvent<undefined>;
    expect(event.data).to.equal(payload);
    expect(event.datacontentype).to.equal(undefined);
  });

  it("Can detect invalid CloudEvent Messages", () => {
    // Create a message that is not an actual event
    const message: MQTTMessage<string> = {
      payload: "Hello world!",
      PUBLISH: {
        "Content type": "text/plain",
      },
      "User Properties": {},
      headers: {},
      body: undefined
    };
    expect(MQTT.isEvent(message)).to.be.false;
  });

  it("Can detect valid CloudEvent Messages", () => {
    // Now create a message that is an event
    const message = MQTT.binary(
      new CloudEvent<Idata>({
        source: "/message-test",
        type: "example",
        data,
      }),
    );
    expect(MQTT.isEvent(message)).to.be.true;
  });

  it("Handles CloudEvents with datacontenttype of text/plain", () => {
    const message: Message<string> = MQTT.binary(
      new CloudEvent({
        source: "/test",
        type: "example",
        datacontenttype: "text/plain",
        data: "Hello, friends!",
      }),
    );
    const event = MQTT.toEvent(message) as CloudEvent<string>;
    expect(event.data).to.equal(message.body);
    expect(event.validate()).to.be.true;
  });

  it("Respects extension attribute casing (even if against spec)", () => {
    // Create a message that is an event
    const body = `{ "greeting": "hello" }`;
    const headers = {
      id: "1234",
      source: "test",
      type: "test.event",
      specversion: "1.0",
      LUNCH: "tacos",
    };
    const message: MQTTMessage<string> = {
      body,
      payload: body,
      PUBLISH,
      "User Properties": headers,
      headers
    };
    expect(MQTT.isEvent(message)).to.be.true;
    const event = MQTT.toEvent(message) as CloudEvent<string>;
    expect(event.LUNCH).to.equal("tacos");
    expect(function () {
      event.validate();
    }).to.throw("invalid attribute name: \"LUNCH\"");
  });

  it("Can detect CloudEvent binary Messages with weird versions", () => {
    // Now create a message that is an event
    const body = `{ "greeting": "hello" }`;
    const headers = {
      id: "1234",
      source: "test",
      type: "test.event",
      specversion: "11.8",
    };
    const message: MQTTMessage<string> = {
      body,
      payload: body,
      PUBLISH,
      headers,
      "User Properties": headers,
    };
    expect(MQTT.isEvent(message)).to.be.true;
    const event = MQTT.toEvent(message) as CloudEvent;
    expect(event.specversion).to.equal("11.8");
    expect(event.validate()).to.be.false;
  });

  it("Can detect CloudEvent structured Messages with weird versions", () => {
    // Now create a message that is an event
    const body = `{ "id": "123", "source": "test", "type": "test.event", "specversion": "11.8"}`;
    const message: MQTTMessage<string> = {
      body,
      payload: body,
      headers: {},
      PUBLISH: {"Content Type": CONSTANTS.MIME_CE_JSON},
      "User Properties": {}
    };
    expect(MQTT.isEvent(message)).to.be.true;
    expect(MQTT.toEvent(message)).not.to.throw;
  });

  // Allow for external systems to send bad events - do what we can
  // to accept them
  it("Does not throw an exception when converting an invalid Message to a CloudEvent", () => {
    const body = `"hello world"`;
    const headers = {
      id: "1234",
      type: "example.bad.event",
      // no required source, thus an invalid event
    };
    const message: MQTTMessage<string> = {
      body,
      payload: body,
      PUBLISH,
      headers,
      "User Properties": headers,
    };
    const event = MQTT.toEvent(message) as CloudEvent;
    expect(event).to.be.instanceOf(CloudEvent);
    // ensure that we actually now have an invalid event
    expect(event.validate).to.throw;
  });

  it("Does not allow an invalid CloudEvent to be converted to a Message", () => {
    const badEvent = new CloudEvent(
      {
        source: "/example.source",
        type: "", // type is required, empty string will throw with strict validation
      },
      false, // turn off strict validation
    );
    expect(() => {
      MQTT.binary(badEvent);
    }).to.throw;
    expect(() => {
      MQTT.structured(badEvent);
    }).to.throw;
  });

  it("Binary Messages can be created from a CloudEvent", () => {
    const message: Message<Idata> = MQTT.binary(fixture);
    expect(message.body).to.equal(data);
    // validate all headers
    expect(message.headers.datacontenttype).to.equal(datacontenttype);
    expect(message.headers.specversion).to.equal(V1);
    expect(message.headers.id).to.equal(id);
    expect(message.headers.type).to.equal(type);
    expect(message.headers.source).to.equal(source);
    expect(message.headers.subject).to.equal(subject);
    expect(message.headers.time).to.equal(fixture.time);
    expect(message.headers.dataschema).to.equal(dataschema);
    expect(message.headers[ext1Name]).to.equal(ext1Value);
    expect(message.headers[ext2Name]).to.equal(ext2Value);
  });

  it("Sets User Properties on binary messages", () => {
    const message: MQTTMessage<Idata> = MQTT.binary(fixture) as MQTTMessage<Idata>;
    expect(message.body).to.equal(data);
    // validate all headers
    expect(message["User Properties"]?.datacontenttype).to.equal(datacontenttype);
    expect(message["User Properties"]?.specversion).to.equal(V1);
    expect(message["User Properties"]?.id).to.equal(id);
    expect(message["User Properties"]?.type).to.equal(type);
    expect(message["User Properties"]?.source).to.equal(source);
    expect(message["User Properties"]?.subject).to.equal(subject);
    expect(message["User Properties"]?.time).to.equal(fixture.time);
    expect(message["User Properties"]?.dataschema).to.equal(dataschema);
    expect(message["User Properties"]?.[ext1Name]).to.equal(ext1Value);
    expect(message["User Properties"]?.[ext2Name]).to.equal(ext2Value);
  });

  it("Structured Messages can be created from a CloudEvent", () => {
    const message = MQTT.structured(fixture) as MQTTMessage<string>;
    expect(message.PUBLISH?.["Content Type"]).to.equal(CONSTANTS.DEFAULT_CE_CONTENT_TYPE);
    expect(message.body).to.deep.equal(message.payload);
    expect(message.payload).to.deep.equal(fixture.toJSON());
    const body = message.body as Record<string, string>;
    expect(body[CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION]).to.equal(V1);
    expect(body[CONSTANTS.CE_ATTRIBUTES.ID]).to.equal(id);
    expect(body[CONSTANTS.CE_ATTRIBUTES.TYPE]).to.equal(type);
    expect(body[CONSTANTS.CE_ATTRIBUTES.SOURCE]).to.equal(source);
    expect(body[CONSTANTS.CE_ATTRIBUTES.SUBJECT]).to.equal(subject);
    expect(body[CONSTANTS.CE_ATTRIBUTES.TIME]).to.equal(fixture.time);
    expect(body[CONSTANTS.STRUCTURED_ATTRS_1.DATA_SCHEMA]).to.equal(dataschema);
    expect(body[ext1Name]).to.equal(ext1Value);
    expect(body[ext2Name]).to.equal(ext2Value);
  });

  it("A CloudEvent can be converted from a binary Message", () => {
    const message = MQTT.binary(fixture);
    const event = MQTT.toEvent(message);
    expect(event).to.deep.equal(fixture);
  });

  it("A CloudEvent can be converted from a structured Message", () => {
    const message = MQTT.structured(fixture);
    const event = MQTT.toEvent(message);
    expect(event).to.deep.equal(fixture);
  });

  it("Converts binary data to base64 when serializing structured messages", () => {
    const event = fixture.cloneWith({ data: imageData, datacontenttype: "image/png" });
    expect(event.data).to.equal(imageData);
    const message = MQTT.structured(event);
    expect((message.body as CloudEvent).data_base64).to.equal(image_base64);
  });

  it("Converts base64 encoded data to binary when deserializing structured messages", () => {
    const message = MQTT.structured(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
    const eventDeserialized = MQTT.toEvent(message) as CloudEvent<Uint8Array>;
    expect(eventDeserialized.data).to.deep.equal(imageData);
    expect(eventDeserialized.data_base64).to.equal(image_base64);
  });

  it("Converts base64 encoded data to binary when deserializing binary messages", () => {
    const message = MQTT.binary(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
    const eventDeserialized = MQTT.toEvent(message) as CloudEvent<Uint8Array>;
    expect(eventDeserialized.data).to.deep.equal(imageData);
    expect(eventDeserialized.data_base64).to.equal(image_base64);
  });

  it("Keeps binary data binary when serializing binary messages", () => {
    const event = fixture.cloneWith({ data: dataBinary });
    expect(event.data).to.equal(dataBinary);
    const message = MQTT.binary(event);
    expect(message.body).to.equal(dataBinary);
  });

  it("Does not parse binary data from binary messages with content type application/json", () => {
    const message = MQTT.binary(fixture.cloneWith({ data: dataBinary }));
    const eventDeserialized = MQTT.toEvent(message) as CloudEvent<Uint8Array>;
    expect(eventDeserialized.data).to.deep.equal(dataBinary);
    expect(eventDeserialized.data_base64).to.equal(data_base64);
  });
});
