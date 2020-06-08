import { expect } from "chai";
import { CloudEvent } from "../";
import { CloudEventV03Attributes } from "../lib/v03";
import { CloudEventV1Attributes } from "../lib/v1";

const { SPEC_V1, SPEC_V03 } = require("../lib/bindings/http/constants");

interface Message {
  type: string;
  subject: string;
  data: any;
  source: string;
  dataContentType: string;
}

const type = "org.cncf.cloudevents.example";
const source = "http://unit.test";

const message: Message = {
  type,
  source,
  subject: "greeting",
  data: {
      hello: "world"
  },
  dataContentType: "application/json"
};

const fixture: CloudEventV1Attributes|CloudEventV03Attributes = {
  source,
  type
};

describe("A CloudEvent", () => {
  it("Can be constructed with a typed Message", () => {
    const ce = new CloudEvent(message);
    expect(ce.type).to.equal(type);
    expect(ce.source).to.equal(source);
  });
});

describe("A 1.0 CloudEvent", () => {
  it("has retreivable source and type attributes", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.source).to.equal("http://unit.test");
    expect(ce.type).to.equal("org.cncf.cloudevents.example");
  });

  it("defaults to specversion 1.0", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.specversion).to.equal("1.0");
  });

  it("generates an ID if one is not provided in the constructor", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.id).to.not.be.empty;
  })

  it("can be created with the specversion SPEC_V1", () => {
    const ce = new CloudEvent({ specversion: SPEC_V1, ...fixture });
    expect(ce.specversion).to.equal(SPEC_V1);
  });

  it("can be constructed with an ID", () => {
    const ce = new CloudEvent({ id: 1234, ...fixture });
    expect(ce.id).to.equal(1234);
  });

  it("generates a timestamp by default", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.time).to.not.be.empty;
  });

  it("can be constructed with a timestamp", () => {
    const time = new Date();
    const ce = new CloudEvent({ time, ...fixture });
    expect(ce.time).to.equal(time.toISOString());
  });

  it("can be constructed with a dataContentType", () => {
    const ce = new CloudEvent({ dataContentType: "application/json", ...fixture });
    expect(ce.dataContentType).to.equal("application/json");
  });

  it("can be constructed with a dataSchema", () => {
    const ce = new CloudEvent({ dataSchema: "http://my.schema", ...fixture });
    expect(ce.dataSchema).to.equal("http://my.schema");
  });

  it("can be constructed with a subject", () => {
    const ce = new CloudEvent({ subject: "science", ...fixture });
    expect(ce.subject).to.equal("science");
  });

  // Handle deprecated attribute - should this really throw?
  it("throws a TypeError when constructed with a schemaurl", () => {
    expect(() => { new CloudEvent({ schemaURL: "http://throw.com", ...fixture }); })
      .to.throw(TypeError, "cannot set schemaURL on version 1.0 event");
  });

  // Handle deprecated attribute - should this really throw?
  it("throws a TypeError when getting a schemaURL", () => {
    const ce = new CloudEvent(fixture);
    expect(() => { ce.schemaURL; })
      .to.throw(TypeError, "cannot get schemaURL from version 1.0 event");
  });

  it("can be constructed with data", () => {
    const data = { lunch: "tacos" };
    const ce = new CloudEvent({
      data, ...fixture
    });
    expect(ce.data).to.equal(data);
  });

  it("has extensions as an empty object by default", () => {
    const ce = new CloudEvent(fixture);
    expect(ce.extensions).to.be.an('object')
    expect(Object.keys(ce.extensions).length).to.equal(0);
  });

  it("can be constructed with extensions", () => {
    const extensions = {
      "extension-key": "extension-value"
    };
    const ce = new CloudEvent({
      extensions, ...fixture
    });
    expect(Object.keys(ce.extensions).length).to.equal(1);
  });

  it("throws ValidationError if the CloudEvent does not conform to the schema");
  it("returns a JSON string even if format is invalid");
  it("correctly formats a CloudEvent as JSON");
});


describe("A 0.3 CloudEvent", () => {
  const v03fixture: CloudEventV03Attributes = { specversion: SPEC_V03, ...fixture };

  it("has retreivable source and type attributes", () => {
    const ce = new CloudEvent(v03fixture);
    expect(ce.source).to.equal("http://unit.test");
    expect(ce.type).to.equal("org.cncf.cloudevents.example");
  });

  it("generates an ID if one is not provided in the constructor", () => {
    const ce = new CloudEvent(v03fixture);
    expect(ce.id).to.not.be.empty;
  })

  it("can be constructed with an ID", () => {
    const ce = new CloudEvent({ id: 1234, ...v03fixture });
    expect(ce.id).to.equal(1234);
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

  it("can be constructed with a dataContentType", () => {
    const ce = new CloudEvent({ dataContentType: "application/json", ...v03fixture });
    expect(ce.dataContentType).to.equal("application/json");
  });

  it("can be constructed with a dataContentEncoding", () => {
    const ce = new CloudEvent({ dataContentEncoding: "Base64", ...v03fixture });
    expect(ce.dataContentEncoding).to.equal("Base64");
  });

  it("can be constructed with a schemaURL", () => {
    const ce = new CloudEvent({ schemaURL: "http://my.schema", ...v03fixture });
    expect(ce.schemaURL).to.equal("http://my.schema");
  });

  it("can be constructed with a subject", () => {
    const ce = new CloudEvent({ subject: "science", ...v03fixture });
    expect(ce.subject).to.equal("science");
  });

  // Handle 1.0 attribute - should this really throw?
  it("throws a TypeError when constructed with a dataSchema", () => {
    expect(() => { new CloudEvent({ dataSchema: "http://throw.com", ...v03fixture }); })
      .to.throw(TypeError, "cannot set dataSchema on version 0.3 event");
  });

  // Handle deprecated attribute - should this really throw?
  it("throws a TypeError when getting a dataSchema", () => {
    const ce = new CloudEvent(v03fixture);
    expect(() => { ce.dataSchema; })
      .to.throw(TypeError, "cannot get dataSchema from version 0.3 event");
  });

  it("can be constructed with data", () => {
    const data = { lunch: "tacos" };
    const ce = new CloudEvent({
      data, ...v03fixture
    });
    expect(ce.data).to.equal(data);
  });

  it("throws ValidationError if the CloudEvent does not conform to the schema");
  it("returns a JSON string even if format is invalid");
  it("correctly formats a CloudEvent as JSON");
});
