const CloudEvent = require("../lib/cloudevent.js");
const { SPEC_V1, SPEC_V03 } = require("../lib/bindings/http/constants.js");

const { expect } = require("chai");

const fixture = {
  source: "http://unit.test",
  type: "org.cncf.cloudevents.example"
};

describe("A 1.0 CloudEvent", () => {
  it("must be created with a source and type", () => {
    expect(() => new CloudEvent()).to.throw(TypeError, "event type and source are required");
  });

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

  it("throws ValidationError if the CloudEvent does not conform to the schema");
  it("returns a JSON string even if format is invalid");
  it("correctly formats a CloudEvent as JSON");
});


describe("A 0.3 CloudEvent", () => {

  const specversion = { specversion: SPEC_V03 };
  const v03fixture = { ...specversion, ...fixture };

  it("must be created with a source and type", () => {
    expect(() => new CloudEvent(specversion)).to.throw(TypeError, "event type and source are required");
  });

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
