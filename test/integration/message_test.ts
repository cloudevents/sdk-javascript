/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import path from "path";
import fs from "fs";

import { expect } from "chai";
import { IncomingHttpHeaders } from "http";
import { CloudEvent, CONSTANTS, Version } from "../../src";
import { asBase64 } from "../../src/event/validation";
import { Message, HTTP } from "../../src/message";

const type = "org.cncf.cloudevents.example";
const source = "urn:event:from:myapi/resource/123";
const time = new Date().toISOString();
const subject = "subject.ext";
const dataschema = "http://cloudevents.io/schema.json";
const datacontenttype = "application/json";
const id = "b46cf653-d48a-4b90-8dfa-355c01061361";
const data = {
  foo: "bar",
};

// Attributes for v03 events
const schemaurl = "https://cloudevents.io/schema.json";

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

describe("HTTP transport", () => {
  it("validates extension attribute names for incoming messages", () => {
    // create a new Message
    const msg: Message = {
      headers: {
        "ce-id": "213",
        "ce-source": "test",
        "ce-type": "test",
        "ce-bad-extension": "value"
      },
      body: undefined
    };
    const evt = HTTP.toEvent(msg) as CloudEvent;
    expect(() => evt.validate()).to.throw(TypeError);
  });

  it("Includes extensions in binary mode when type is 'boolean' with a false value", () => {
    const evt = new CloudEvent({ source: "test", type: "test", extboolean: false });
    expect(evt.hasOwnProperty("extboolean")).to.equal(true);
    expect(evt["extboolean"]).to.equal(false);
    const message = HTTP.binary(evt);
    expect(message.headers.hasOwnProperty("ce-extboolean")).to.equal(true);
    expect(message.headers["ce-extboolean"]).to.equal(false);
  });

  it("Includes extensions in structured when type is 'boolean' with a false value", () => {
    const evt = new CloudEvent({ source: "test", type: "test", extboolean: false });
    expect(evt.hasOwnProperty("extboolean")).to.equal(true);
    expect(evt["extboolean"]).to.equal(false);
    const message = HTTP.structured(evt);
    const body = JSON.parse(message.body as string);
    expect(body.hasOwnProperty("extboolean")).to.equal(true);
    expect(body.extboolean).to.equal(false);
  });

  it("Handles events with no content-type and no datacontenttype", () => {
    const body = "{Something[Not:valid}JSON";
    const message: Message<undefined> = {
      body,
      headers: {
        "ce-source": "/test/type",
        "ce-type": "test.type",
        "ce-id": "1234",
      },
    };
    const event: CloudEvent = HTTP.toEvent(message) as CloudEvent;
    expect(event.data).to.equal(body);
    expect(event.datacontentype).to.equal(undefined);
  });

  it("Can detect invalid CloudEvent Messages", () => {
    // Create a message that is not an actual event
    const message: Message<undefined> = {
      body: "Hello world!",
      headers: {
        "Content-type": "text/plain",
      },
    };
    expect(HTTP.isEvent(message)).to.be.false;
  });

  it("Can detect valid CloudEvent Messages", () => {
    // Now create a message that is an event
    const message = HTTP.binary(
      new CloudEvent({
        source: "/message-test",
        type: "example",
        data,
      }),
    );
    expect(HTTP.isEvent(message)).to.be.true;
  });

  it("Handles CloudEvents with datacontenttype of text/plain", () => {
    const message: Message = HTTP.binary(
      new CloudEvent({
        source: "/test",
        type: "example",
        datacontenttype: "text/plain",
        data: "Hello, friends!",
      }),
    );
    const event = HTTP.toEvent(message) as CloudEvent<string>;
    expect(event.validate()).to.be.true;
  });

  it("Respects extension attribute casing (even if against spec)", () => {
    // Now create a message that is an event
    const message = {
      body: `{ "greeting": "hello" }`,
      headers: {
        [CONSTANTS.CE_HEADERS.ID]: "1234",
        [CONSTANTS.CE_HEADERS.SOURCE]: "test",
        [CONSTANTS.CE_HEADERS.TYPE]: "test.event",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        "ce-LUNCH": "tacos",
      },
    };
    expect(HTTP.isEvent(message)).to.be.true;
    const event = HTTP.toEvent(message) as CloudEvent;
    expect(event.LUNCH).to.equal("tacos");
    expect(function () {
      event.validate();
    }).to.throw("invalid attribute name: \"LUNCH\"");
  });

  it("Can detect CloudEvent binary Messages with weird versions", () => {
    // Now create a message that is an event
    const message = {
      body: `{ "greeting": "hello" }`,
      headers: {
        [CONSTANTS.CE_HEADERS.ID]: "1234",
        [CONSTANTS.CE_HEADERS.SOURCE]: "test",
        [CONSTANTS.CE_HEADERS.TYPE]: "test.event",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: "11.8",
      },
    };
    expect(HTTP.isEvent(message)).to.be.true;
    const event = HTTP.toEvent(message) as CloudEvent;
    expect(event.specversion).to.equal("11.8");
    expect(event.validate()).to.be.false;
  });

  it("Can detect CloudEvent structured Messages with weird versions", () => {
    // Now create a message that is an event
    const message = {
      body: `{ "source": "test", "type": "test.event", "specversion": "11.8"}`,
      headers: {
        [CONSTANTS.CE_HEADERS.ID]: "1234",
      },
    };
    expect(HTTP.isEvent(message)).to.be.true;
    expect(HTTP.toEvent(message)).not.to.throw;
  });
  // Allow for external systems to send bad events - do what we can
  // to accept them
  it("Does not throw an exception when converting an invalid Message to a CloudEvent", () => {
    const message: Message<undefined> = {
      body: `"hello world"`,
      headers: {
        "content-type": "application/json",
        "ce-id": "1234",
        "ce-type": "example.bad.event",
        "ce-specversion": "1.0",
        // no required ce-source header, thus an invalid event
      },
    };
    const event = HTTP.toEvent(message) as CloudEvent;
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
      HTTP.binary(badEvent);
    }).to.throw;
    expect(() => {
      HTTP.structured(badEvent);
    }).to.throw;
  });

  it("Can be created with Node's IncomingHttpHeaders", () => {
    const headers: IncomingHttpHeaders = {
      "content-type": CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
    };
    const body = JSON.stringify({
      id,
      type,
      source,
      specversion: Version.V1,
      data: { lunch: "tacos" },
    });
    const message: Message<undefined> = {
      headers,
      body,
    };
    const event = HTTP.toEvent(message) as CloudEvent;
    expect(event.data).to.deep.equal({ lunch: "tacos" });
  });

  describe("Specification version V1", () => {
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
    });

    it("Binary Messages can be created from a CloudEvent", () => {
      const message: Message = HTTP.binary(fixture);
      expect(message.body).to.equal(JSON.stringify(data));
      // validate all headers
      expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal(datacontenttype);
      expect(message.headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(Version.V1);
      expect(message.headers[CONSTANTS.CE_HEADERS.ID]).to.equal(id);
      expect(message.headers[CONSTANTS.CE_HEADERS.TYPE]).to.equal(type);
      expect(message.headers[CONSTANTS.CE_HEADERS.SOURCE]).to.equal(source);
      expect(message.headers[CONSTANTS.CE_HEADERS.SUBJECT]).to.equal(subject);
      expect(message.headers[CONSTANTS.CE_HEADERS.TIME]).to.equal(fixture.time);
      expect(message.headers[CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]).to.equal(dataschema);
      expect(message.headers[`ce-${ext1Name}`]).to.equal(ext1Value);
      expect(message.headers[`ce-${ext2Name}`]).to.equal(ext2Value);
    });

    it("Structured Messages can be created from a CloudEvent", () => {
      const message: Message<string> = HTTP.structured(fixture);
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
      const message = HTTP.binary(fixture);
      const event = HTTP.toEvent(message);
      expect(event).to.deep.equal(fixture);
    });

    it("A CloudEvent can be converted from a structured Message", () => {
      const message = HTTP.structured(fixture);
      const event = HTTP.toEvent(message);
      expect(event).to.deep.equal(fixture);
    });

    it("Converts binary data to base64 when serializing structured messages", () => {
      const event = fixture.cloneWith({ data: imageData, datacontenttype: "image/png" });
      expect(event.data).to.equal(imageData);
      const message = HTTP.structured(event);
      const messageBody = JSON.parse(message.body as string);
      expect(messageBody.data_base64).to.equal(image_base64);
    });

    it("Converts base64 encoded data to binary when deserializing structured messages", () => {
      const message = HTTP.structured(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
      const eventDeserialized = HTTP.toEvent(message) as CloudEvent<Uint32Array>;
      expect(eventDeserialized.data).to.deep.equal(imageData);
      expect(eventDeserialized.data_base64).to.equal(image_base64);
    });

    it("Does not parse binary data from structured messages with content type application/json", () => {
      const message = HTTP.structured(fixture.cloneWith({ data: dataBinary }));
      const eventDeserialized = HTTP.toEvent(message) as CloudEvent<Uint32Array>;
      expect(eventDeserialized.data).to.deep.equal(dataBinary);
      expect(eventDeserialized.data_base64).to.equal(data_base64);
    });

    it("Converts base64 encoded data to binary when deserializing binary messages", () => {
      const message = HTTP.binary(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
      const eventDeserialized = HTTP.toEvent(message) as CloudEvent<Uint32Array>;
      expect(eventDeserialized.data).to.deep.equal(imageData);
      expect(eventDeserialized.data_base64).to.equal(image_base64);
    });

    it("Keeps binary data binary when serializing binary messages", () => {
      const event = fixture.cloneWith({ data: dataBinary });
      expect(event.data).to.equal(dataBinary);
      const message = HTTP.binary(event);
      expect(message.body).to.equal(dataBinary);
    });

    it("Does not parse binary data from binary messages with content type application/json", () => {
      const message = HTTP.binary(fixture.cloneWith({ data: dataBinary }));
      const eventDeserialized = HTTP.toEvent(message) as CloudEvent<Uint32Array>;
      expect(eventDeserialized.data).to.deep.equal(dataBinary);
      expect(eventDeserialized.data_base64).to.equal(data_base64);
    });
  });

  describe("Specification version V03", () => {
    const fixture = new CloudEvent({
      specversion: Version.V03,
      id,
      type,
      source,
      datacontenttype,
      subject,
      time,
      schemaurl,
      data,
      [ext1Name]: ext1Value,
      [ext2Name]: ext2Value,
    });

    it("Binary Messages can be created from a CloudEvent", () => {
      const message: Message = HTTP.binary(fixture);
      expect(message.body).to.equal(JSON.stringify(data));
      // validate all headers
      expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal(datacontenttype);
      expect(message.headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(Version.V03);
      expect(message.headers[CONSTANTS.CE_HEADERS.ID]).to.equal(id);
      expect(message.headers[CONSTANTS.CE_HEADERS.TYPE]).to.equal(type);
      expect(message.headers[CONSTANTS.CE_HEADERS.SOURCE]).to.equal(source);
      expect(message.headers[CONSTANTS.CE_HEADERS.SUBJECT]).to.equal(subject);
      expect(message.headers[CONSTANTS.CE_HEADERS.TIME]).to.equal(fixture.time);
      expect(message.headers[CONSTANTS.BINARY_HEADERS_03.SCHEMA_URL]).to.equal(schemaurl);
      expect(message.headers[`ce-${ext1Name}`]).to.equal(ext1Value);
      expect(message.headers[`ce-${ext2Name}`]).to.equal(ext2Value);
    });

    it("Structured Messages can be created from a CloudEvent", () => {
      const message: Message = HTTP.structured(fixture);
      expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal(CONSTANTS.DEFAULT_CE_CONTENT_TYPE);
      // Parse the message body as JSON, then validate the attributes
      const body = JSON.parse(message.body as string);
      expect(body[CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION]).to.equal(Version.V03);
      expect(body[CONSTANTS.CE_ATTRIBUTES.ID]).to.equal(id);
      expect(body[CONSTANTS.CE_ATTRIBUTES.TYPE]).to.equal(type);
      expect(body[CONSTANTS.CE_ATTRIBUTES.SOURCE]).to.equal(source);
      expect(body[CONSTANTS.CE_ATTRIBUTES.SUBJECT]).to.equal(subject);
      expect(body[CONSTANTS.CE_ATTRIBUTES.TIME]).to.equal(fixture.time);
      expect(body[CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL]).to.equal(schemaurl);
      expect(body[ext1Name]).to.equal(ext1Value);
      expect(body[ext2Name]).to.equal(ext2Value);
    });

    it("A CloudEvent can be converted from a binary Message", () => {
      const message = HTTP.binary(fixture);
      const event = HTTP.toEvent(message);
      expect(event).to.deep.equal(fixture);
    });

    it("A CloudEvent can be converted from a structured Message", () => {
      const message = HTTP.structured(fixture);
      const event = HTTP.toEvent(message);
      expect(event).to.deep.equal(fixture);
    });

    it("Converts binary data to base64 when serializing structured messages", () => {
      const event = fixture.cloneWith({ data: imageData, datacontenttype: "image/png" });
      expect(event.data).to.equal(imageData);
      const message = HTTP.structured(event);
      const messageBody = JSON.parse(message.body as string);
      expect(messageBody.data_base64).to.equal(image_base64);
    });

    it("Converts base64 encoded data to binary when deserializing structured messages", () => {
      // Creating an event with binary data automatically produces base64 encoded data
      // which is then set as the 'data' attribute on the message body
      const message = HTTP.structured(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
      const eventDeserialized = HTTP.toEvent(message) as CloudEvent<Uint32Array>;
      expect(eventDeserialized.data).to.deep.equal(imageData);
      expect(eventDeserialized.data_base64).to.equal(image_base64);
    });

    it("Converts base64 encoded data to binary when deserializing binary messages", () => {
      const message = HTTP.binary(fixture.cloneWith({ data: imageData, datacontenttype: "image/png" }));
      const eventDeserialized = HTTP.toEvent(message) as CloudEvent<Uint32Array>;
      expect(eventDeserialized.data).to.deep.equal(imageData);
      expect(eventDeserialized.data_base64).to.equal(image_base64);
    });

    it("Keeps binary data binary when serializing binary messages", () => {
      const event = fixture.cloneWith({ data: dataBinary });
      expect(event.data).to.equal(dataBinary);
      const message = HTTP.binary(event);
      expect(message.body).to.equal(dataBinary);
    });
  });
});
