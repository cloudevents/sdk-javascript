/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import path from "path";
import fs from "fs";

import { expect } from "chai";
import { CloudEvent, CONSTANTS, Version } from "../../src";
import { asBase64 } from "../../src/event/validation";
import { Message, Kafka, KafkaMessage, KafkaEvent } from "../../src/message";
import { KAFKA_CE_HEADERS } from "../../src/message/kafka/headers";

const key = "foo/bar";
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
const dataBinary = Uint32Array.from(JSON.stringify(data), (c) => c.codePointAt(0) as number);
const data_base64 = asBase64(dataBinary);

// Since the above is a special case (string as binary), let's test
// with a real binary file one is likely to encounter in the wild
const imageData = new Uint32Array(fs.readFileSync(path.join(process.cwd(), "test", "integration", "ce.png")));
const image_base64 = asBase64(imageData);

const fixture = new CloudEvent({
  specversion: Version.V1,
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
  partitionkey: key,
});

describe("Kafka transport", () => {
  it("Handles events with no content-type and no datacontenttype", () => {
    const value = "{Something[Not:valid}JSON";
    const message: KafkaMessage<string> = {
      key,
      value,
      headers: {
        [KAFKA_CE_HEADERS.SOURCE]: "/test/kafka",
        [KAFKA_CE_HEADERS.TYPE]: "test.kafka",
        [KAFKA_CE_HEADERS.ID]: "1234",
      },
      body: undefined,
    };
    const event: CloudEvent = Kafka.toEvent(message) as CloudEvent;
    expect(event.data).to.equal(value);
    expect(event.datacontentype).to.equal(undefined);
  });

  it("Can detect invalid CloudEvent Messages", () => {
    // Create a message that is not an actual event
    const message: KafkaMessage<string> = {
      key,
      value: "Hello world!",
      headers: {
        "Content-type": "text/plain",
      },
      body: undefined
    };
    expect(Kafka.isEvent(message)).to.be.false;
  });

  it("Can detect valid CloudEvent Messages", () => {
    // Now create a message that is an event
    const message = Kafka.binary(
      new CloudEvent<Idata>({
        source: "/message-test",
        type: "example",
        data,
      }),
    );
    expect(Kafka.isEvent(message)).to.be.true;
  });

  it("Handles CloudEvents with datacontenttype of text/plain", () => {
    const message: Message<string> = Kafka.binary(
      new CloudEvent({
        source: "/test",
        type: "example",
        datacontenttype: "text/plain",
        data: "Hello, friends!",
      }),
    );
    const event = Kafka.toEvent(message) as CloudEvent<string>;
    expect(event.validate()).to.be.true;
  });

  it("Respects extension attribute casing (even if against spec)", () => {
    // Create a message that is an event
    const message: KafkaMessage<string> = {
      key,
      body: undefined,
      value: `{ "greeting": "hello" }`,
      headers: {
        [KAFKA_CE_HEADERS.ID]: "1234",
        [KAFKA_CE_HEADERS.SOURCE]: "test",
        [KAFKA_CE_HEADERS.TYPE]: "test.event",
        "ce_LUNCH": "tacos",
      },
    };
    expect(Kafka.isEvent(message)).to.be.true;
    const event = Kafka.toEvent(message) as CloudEvent<string>;
    expect(event.LUNCH).to.equal("tacos");
    expect(function () {
      event.validate();
    }).to.throw("invalid attribute name: \"LUNCH\"");
  });

  it("Can detect CloudEvent binary Messages with weird versions", () => {
    // Now create a message that is an event
    const message: KafkaMessage<string> = {
      key,
      body: undefined,
      value: `{ "greeting": "hello" }`,
      headers: {
        [KAFKA_CE_HEADERS.ID]: "1234",
        [KAFKA_CE_HEADERS.SOURCE]: "test",
        [KAFKA_CE_HEADERS.TYPE]: "test.event",
        [KAFKA_CE_HEADERS.SPEC_VERSION]: "11.8",
      },
    };
    expect(Kafka.isEvent(message)).to.be.true;
    const event = Kafka.toEvent(message) as CloudEvent;
    expect(event.specversion).to.equal("11.8");
    expect(event.validate()).to.be.false;
  });

  it("Can detect CloudEvent structured Messages with weird versions", () => {
    // Now create a message that is an event
    const message: KafkaMessage<string> = {
      key,
      body: undefined,
      value: `{ "source": "test", "type": "test.event", "specversion": "11.8"}`,
      headers: {
        [KAFKA_CE_HEADERS.ID]: "1234",
      },
    };
    expect(Kafka.isEvent(message)).to.be.true;
    expect(Kafka.toEvent(message)).not.to.throw;
  });

  // Allow for external systems to send bad events - do what we can
  // to accept them
  it("Does not throw an exception when converting an invalid Message to a CloudEvent", () => {
    const message: KafkaMessage<string> = {
      key,
      body: undefined,
      value: `"hello world"`,
      headers: {
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
        [KAFKA_CE_HEADERS.ID]: "1234",
        [KAFKA_CE_HEADERS.TYPE]: "example.bad.event",
        // no required ce_source header, thus an invalid event
      },
    };
    const event = Kafka.toEvent(message) as CloudEvent;
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
      Kafka.binary(badEvent);
    }).to.throw;
    expect(() => {
      Kafka.structured(badEvent);
    }).to.throw;
  });

  // https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#31-key-mapping
  it("Maps `KafkaMessage#key` value to CloudEvent#partitionkey property", () => {
    const message: KafkaMessage<string> = {
      key,
      body: undefined,
      value: `{ "source": "test", "type": "test.event", "specversion": "11.8"}`,
      headers: {
        [KAFKA_CE_HEADERS.ID]: "1234",
      },
    };
    const event = Kafka.toEvent(message) as KafkaEvent<string>;
    expect(event.partitionkey).to.equal(key);
  });

  // https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#31-key-mapping
  it("Maps CloudEvent#partitionkey value to a `key` in binary KafkaMessages", () => {
    const event = new CloudEvent({
      source,
      type,
      partitionkey: key,
    });
    const message = Kafka.binary(event) as KafkaMessage;
    expect(message.key).to.equal(key);
  });

  it("Binary Messages can be created from a CloudEvent", () => {
    const message: Message<Idata> = Kafka.binary(fixture);
    expect(message.body).to.equal(data);
    // validate all headers
    expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal(datacontenttype);
    expect(message.headers[KAFKA_CE_HEADERS.SPEC_VERSION]).to.equal(Version.V1);
    expect(message.headers[KAFKA_CE_HEADERS.ID]).to.equal(id);
    expect(message.headers[KAFKA_CE_HEADERS.TYPE]).to.equal(type);
    expect(message.headers[KAFKA_CE_HEADERS.SOURCE]).to.equal(source);
    expect(message.headers[KAFKA_CE_HEADERS.SUBJECT]).to.equal(subject);
    expect(message.headers[KAFKA_CE_HEADERS.TIME]).to.equal(fixture.time);
    expect(message.headers[KAFKA_CE_HEADERS.DATASCHEMA]).to.equal(dataschema);
    expect(message.headers[`ce_${ext1Name}`]).to.equal(ext1Value);
    expect(message.headers[`ce_${ext2Name}`]).to.equal(ext2Value);
  });

  it("Structured Messages can be created from a CloudEvent", () => {
    const message: Message<Idata> = Kafka.structured(fixture);
    expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal(CONSTANTS.DEFAULT_CE_CONTENT_TYPE);
    // Parse the message body as JSON, then validate the attributes
    const body = JSON.parse(message.body as string);
    expect(body[CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION]).to.equal(Version.V1);
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
      const message = Kafka.binary(fixture);
      const event = Kafka.toEvent(message);

      // The Kafka deserializer sets a partitionkey
      expect(event).to.deep.equal({...fixture, partitionkey: (event as KafkaEvent<any>).partitionkey});
    });
  it("A CloudEvent can be converted from a binary Message", () => {
    const message = Kafka.binary(fixture);
    const event = Kafka.toEvent(message);
    expect(event).to.deep.equal(fixture);
  });

  it("A CloudEvent can be converted from a structured Message", () => {
    const message = Kafka.structured(fixture);
    const event = Kafka.toEvent(message);
    expect(event).to.deep.equal(fixture);
  });

  it("Converts binary data to base64 when serializing structured messages", () => {
    const event = fixture.cloneWith({ data: imageData, datacontenttype: "image/png" });
    expect(event.data).to.equal(imageData);
    const message = Kafka.structured(event);
    const messageBody = JSON.parse(message.body as string);
    expect(messageBody.data_base64).to.equal(image_base64);
  });

  it.skip("Converts base64 encoded data to binary when deserializing structured messages", () => {
    const message = Kafka.structured(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
    const eventDeserialized = Kafka.toEvent(message) as CloudEvent<Uint32Array>;
    expect(eventDeserialized.data).to.deep.equal(imageData);
    expect(eventDeserialized.data_base64).to.equal(image_base64);
  });

  it("Converts base64 encoded data to binary when deserializing binary messages", () => {
    const message = Kafka.binary(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
    const eventDeserialized = Kafka.toEvent(message) as CloudEvent<Uint32Array>;
    expect(eventDeserialized.data).to.deep.equal(imageData);
    expect(eventDeserialized.data_base64).to.equal(image_base64);
  });

  it("Keeps binary data binary when serializing binary messages", () => {
    const event = fixture.cloneWith({ data: dataBinary });
    expect(event.data).to.equal(dataBinary);
    const message = Kafka.binary(event);
    expect(message.body).to.equal(dataBinary);
  });

  it("Does not parse binary data from binary messages with content type application/json", () => {
    const message = Kafka.binary(fixture.cloneWith({ data: dataBinary }));
    const eventDeserialized = Kafka.toEvent(message) as CloudEvent<Uint32Array>;
    expect(eventDeserialized.data).to.deep.equal(dataBinary);
    expect(eventDeserialized.data_base64).to.equal(data_base64);
  });
});
