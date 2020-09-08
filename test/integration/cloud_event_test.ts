import { expect } from "chai";
import { CloudEvent, ValidationError, Version } from "../../src";
import { CloudEventV03, CloudEventV1 } from "../../src/event/interfaces";

const type = "org.cncf.cloudevents.example";
const source = "http://unit.test";
const id = "b46cf653-d48a-4b90-8dfa-355c01061361";

const fixture: CloudEventV1 = {
  id,
  specversion: Version.V1,
  source,
  type,
  data: `"some data"`,
};

describe("A CloudEvent", () => {
  it("Can be constructed with a typed Message", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.type).to.equal(type);
    expect(ce.source).to.equal(source);
  });

  it("Can be constructed with loose validation", () => {
    const ce = new CloudEvent({} as CloudEventV1, false);
    expect(ce).to.be.instanceOf(CloudEvent);
  });

  it("Loosely validated events can be cloned", () => {
    const ce = new CloudEvent({} as CloudEventV1, false);
    expect(ce.cloneWith({}, false)).to.be.instanceOf(CloudEvent);
  });

  it("Loosely validated events throw when validated", () => {
    const ce = new CloudEvent({} as CloudEventV1, false);
    expect(ce.validate).to.throw(ValidationError, "invalid payload");
  });

  it("serializes as JSON with toString()", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.toString()).to.deep.equal(JSON.stringify(ce));
  });

  it("Throw a validation error for invalid extension names", () => {
    expect(() => {
      new CloudEvent({ "ext-1": "extension1", ...fixture });
    }).throw("invalid extension name");
  });

  it("Throw a validation error for invalid extension names, more than 20 chars", () => {
    expect(() => {
      new CloudEvent({ "123456789012345678901": "extension1", ...fixture });
    }).throw("invalid extension name");
  });
});

describe("A 1.0 CloudEvent", () => {
  it("has retreivable source and type attributes", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.source).to.equal("http://unit.test");
    expect(ce.type).to.equal("org.cncf.cloudevents.example");
  });

  it("defaults to specversion 1.0", () => {
    const ce = new CloudEvent({ source, type });
    expect(ce.specversion).to.equal("1.0");
  });

  it("generates an ID if one is not provided in the constructor", () => {
    const ce = new CloudEvent({ source, type });
    expect(ce.id).to.not.be.empty;
  });

  it("can be constructed with an ID", () => {
    const ce = new CloudEvent({ id: "1234", specversion: Version.V1, source, type });
    expect(ce.id).to.equal("1234");
  });

  it("generates a timestamp by default", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.time).to.not.be.empty;
  });

  it("can be constructed with a timestamp", () => {
    const time = new Date().toISOString();
    const ce = new CloudEvent({ time, ...fixture });
    expect(ce.time).to.equal(time);
  });

  it("can be constructed with a datacontenttype", () => {
    const ce = new CloudEvent({ datacontenttype: "application/json", ...fixture });
    expect(ce.datacontenttype).to.equal("application/json");
  });

  it("can be constructed with a dataschema", () => {
    const ce = new CloudEvent({ dataschema: "http://my.schema", ...fixture });
    expect(ce.dataschema).to.equal("http://my.schema");
  });

  it("can be constructed with a subject", () => {
    const ce = new CloudEvent({ subject: "science", ...fixture });
    expect(ce.subject).to.equal("science");
  });

  // Handle deprecated attribute - should this really throw?
  it("throws a TypeError when constructed with a schemaurl", () => {
    expect(() => {
      new CloudEvent({ schemaurl: "http://throw.com", ...fixture });
    }).to.throw(TypeError, "cannot set schemaurl on version 1.0 event");
  });

  it("can be constructed with data", () => {
    const ce = new CloudEvent({
      ...fixture,
      data: { lunch: "tacos" },
    });
    expect(ce.data).to.deep.equal({ lunch: "tacos" });
  });

  it("can be constructed with data as an Array", () => {
    const ce = new CloudEvent({
      ...fixture,
      data: [{ lunch: "tacos" }, { supper: "sushi" }],
    });
    expect(ce.data).to.deep.equal([{ lunch: "tacos" }, { supper: "sushi" }]);
  });

  it("can be constructed with data as a number", () => {
    const ce = new CloudEvent({
      ...fixture,
      data: 100,
    });
    expect(ce.data).to.equal(100);
  });

  it("can be constructed with null data", () => {
    const ce = new CloudEvent({
      ...fixture,
      data: null,
    });
    expect(ce.data).to.equal(null);
  });

  it("can be constructed with data as a boolean", () => {
    const ce = new CloudEvent({
      ...fixture,
      data: true,
    });
    expect(ce.data).to.be.true;
  });

  it("can be constructed with extensions", () => {
    const extensions = {
      extensionkey: "extension-value",
    };
    const ce = new CloudEvent({
      ...extensions,
      ...fixture,
    });
    expect(ce["extensionkey"]).to.equal(extensions["extensionkey"]);
  });

  it("throws TypeError if the CloudEvent does not conform to the schema", () => {
    try {
      new CloudEvent({
        ...fixture,
        source: (null as unknown) as string,
      });
    } catch (err) {
      expect(err).to.be.instanceOf(TypeError);
      expect(err.message).to.include("invalid payload");
    }
  });

  it("correctly formats a CloudEvent as JSON", () => {
    const ce = new CloudEvent({ ...fixture });
    const json = ce.toString();
    const obj = JSON.parse((json as unknown) as string);
    expect(obj.type).to.equal(type);
    expect(obj.source).to.equal(source);
    expect(obj.specversion).to.equal(Version.V1);
  });
});

describe("A 0.3 CloudEvent", () => {
  const v03fixture: CloudEventV03 = { ...fixture };
  v03fixture.specversion = Version.V03;

  it("has retreivable source and type attributes", () => {
    const ce = new CloudEvent(v03fixture);
    expect(ce.source).to.equal("http://unit.test");
    expect(ce.type).to.equal("org.cncf.cloudevents.example");
  });

  it("generates an ID if one is not provided in the constructor", () => {
    const ce = new CloudEvent({ source, type, specversion: Version.V03 });
    expect(ce.id).to.not.be.empty;
    expect(ce.specversion).to.equal(Version.V03);
  });

  it("generates a timestamp by default", () => {
    const ce = new CloudEvent(v03fixture);
    expect(ce.time).to.not.be.empty;
  });

  it("can be constructed with a timestamp", () => {
    const time = new Date();
    const ce = new CloudEvent({ time, ...v03fixture });
    expect(ce.time).to.equal(time.toISOString());
  });

  it("can be constructed with a datacontenttype", () => {
    const ce = new CloudEvent({ datacontenttype: "application/json", ...v03fixture });
    expect(ce.datacontenttype).to.equal("application/json");
  });

  it("can be constructed with a datacontentencoding", () => {
    const ce = new CloudEvent({ datacontentencoding: "Base64", ...v03fixture, data: "SSB3YXMgZnVubnkg8J+Ygg==" });
    expect(ce.datacontentencoding).to.equal("Base64");
  });

  it("can be constructed with a schemaurl", () => {
    const ce = new CloudEvent({ schemaurl: "http://my.schema", ...v03fixture });
    expect(ce.schemaurl).to.equal("http://my.schema");
  });

  it("can be constructed with a subject", () => {
    const ce = new CloudEvent({ subject: "science", ...v03fixture });
    expect(ce.subject).to.equal("science");
  });

  // Handle 1.0 attribute - should this really throw?
  it("throws a TypeError when constructed with a dataschema", () => {
    expect(() => {
      new CloudEvent({ dataschema: "http://throw.com", ...v03fixture });
    }).to.throw(TypeError, "cannot set dataschema on version 0.3 event");
  });

  it("can be constructed with data", () => {
    const ce = new CloudEvent({
      ...v03fixture,
      data: { lunch: "tacos" },
    });
    expect(ce.data).to.deep.equal({ lunch: "tacos" });
  });

  it("throws TypeError if the CloudEvent does not conform to the schema", () => {
    try {
      new CloudEvent({
        ...v03fixture,
        source: (null as unknown) as string,
      });
    } catch (err) {
      expect(err).to.be.instanceOf(ValidationError);
      expect(err.message).to.include("invalid payload");
    }
  });

  it("correctly formats a CloudEvent as JSON", () => {
    const ce = new CloudEvent({ ...v03fixture });
    const json = ce.toString();
    const obj = JSON.parse((json as unknown) as string);
    expect(obj.type).to.equal(type);
    expect(obj.source).to.equal(source);
    expect(obj.specversion).to.equal(Version.V03);
  });
});
