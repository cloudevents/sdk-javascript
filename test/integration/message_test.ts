import { expect } from "chai";
import { CloudEvent, CONSTANTS, Version } from "../../src";
import { Message, HTTP } from "../../src/messages";

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

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

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

describe("HTTP transport messages", () => {
  it("V1 binary Messages can be created from a CloudEvent", () => {
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

  it("V1 structured Messages can be created from a CloudEvent", () => {
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

  it("V1 CloudEvent can be converted from a binary Message", () => {
    const message = HTTP.binary(fixture);
    const event = HTTP.toEvent(message);
    expect(event).to.deep.equal(fixture);
  });

  it("V1 CloudEvent can be converted from a structured Message", () => {
    const message = HTTP.structured(fixture);
    const event = HTTP.toEvent(message);
    expect(event).to.deep.equal(fixture);
  });
});
