import { expect } from "chai";
import { CloudEvent, CONSTANTS, Version } from "../../src";
import { asBase64 } from "../../src/event/validation";
import { Message, HTTP } from "../../src/message";

const type = "org.cncf.cloudevents.example";
const source = "urn:event:from:myapi/resource/123";
const time = new Date();
const subject = "subject.ext";
const dataschema = "http://cloudevents.io/schema.json";
const datacontenttype = "application/json";
const id = "b46cf653-d48a-4b90-8dfa-355c01061361";
const data = {
  foo: "bar",
};

// Attributes for v03 events
const schemaurl = "https://cloudevents.io/schema.json";
const datacontentencoding = "base64";

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

// Binary data as base64
const dataBinary = Uint32Array.from(JSON.stringify(data), (c) => c.codePointAt(0) as number);
const data_base64 = asBase64(dataBinary);

describe("HTTP transport", () => {
  it("Can detect invalid CloudEvent Messages", () => {
    // Create a message that is not an actual event
    const message: Message = {
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
      }),
    );
    expect(HTTP.isEvent(message)).to.be.true;
  });

  // Allow for external systems to send bad events - do what we can
  // to accept them
  it("Does not throw an exception when converting an invalid Message to a CloudEvent", () => {
    const message: Message = {
      body: `"hello world"`,
      headers: {
        "content-type": "application/json",
        "ce-id": "1234",
        "ce-type": "example.bad.event",
        "ce-specversion": "1.0",
        // no required ce-source header, thus an invalid event
      },
    };
    const event = HTTP.toEvent(message);
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

  describe("Specification version V1", () => {
    const fixture: CloudEvent = new CloudEvent({
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
      expect(message.body).to.equal(data);
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
      const message: Message = HTTP.structured(fixture);
      expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal(CONSTANTS.DEFAULT_CE_CONTENT_TYPE);
      // Parse the message body as JSON, then validate the attributes
      const body = JSON.parse(message.body);
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

    it("Supports Base-64 encoded data in structured messages", () => {
      const event = fixture.cloneWith({ data: dataBinary });
      expect(event.data_base64).to.equal(data_base64);
      const message = HTTP.structured(event);
      const eventDeserialized = HTTP.toEvent(message);
      expect(eventDeserialized.data).to.deep.equal({ foo: "bar" });
    });

    it("Supports Base-64 encoded data in binary messages", () => {
      const event = fixture.cloneWith({ data: dataBinary });
      expect(event.data_base64).to.equal(data_base64);
      const message = HTTP.binary(event);
      const eventDeserialized = HTTP.toEvent(message);
      expect(eventDeserialized.data).to.deep.equal({ foo: "bar" });
    });
  });

  describe("Specification version V03", () => {
    const fixture: CloudEvent = new CloudEvent({
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
      expect(message.body).to.equal(data);
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
      const body = JSON.parse(message.body);
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

    it("Supports Base-64 encoded data in structured messages", () => {
      const event = fixture.cloneWith({ data: dataBinary, datacontentencoding });
      expect(event.data_base64).to.equal(data_base64);
      const message = HTTP.structured(event);
      const eventDeserialized = HTTP.toEvent(message);
      expect(eventDeserialized.data).to.deep.equal({ foo: "bar" });
    });

    it("Supports Base-64 encoded data in binary messages", () => {
      const event = fixture.cloneWith({ data: dataBinary, datacontentencoding });
      expect(event.data_base64).to.equal(data_base64);
      const message = HTTP.binary(event);
      const eventDeserialized = HTTP.toEvent(message);
      expect(eventDeserialized.data).to.deep.equal({ foo: "bar" });
    });
  });
});
