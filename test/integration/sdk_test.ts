/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import { CloudEvent, CloudEventV1, V1, V03 } from "../../src";

const fixture: CloudEventV1<undefined> = {
  id: "123",
  type: "org.cloudevents.test",
  source: "http://cloudevents.io",
  specversion: V1,
};

describe("The SDK Requirements", () => {
  it("should expose a CloudEvent type", () => {
    const event = new CloudEvent(fixture);
    expect(event instanceof CloudEvent).to.equal(true);
  });

  describe("v0.3", () => {
    it("should create an (invalid) event using the right spec version", () => {
      expect(
        new CloudEvent({
          ...fixture,
          specversion: V03,
        }, false).specversion,
      ).to.equal(V03);
    });
  });

  describe("v1.0", () => {
    it("should create an event using the right spec version", () => {
      expect(new CloudEvent(fixture).specversion).to.equal(V1);
    });
  });

  describe("Cloning events", () => {
    it("should clone simple objects that adhere to the CloudEventV1 interface", () => {
      const copy = CloudEvent.cloneWith(fixture, { id: "456" }, false);
      expect(copy.id).to.equal("456");
      expect(copy.type).to.equal(fixture.type);
      expect(copy.source).to.equal(fixture.source);
      expect(copy.specversion).to.equal(fixture.specversion);
    });

    it("should clone simple objects with data that adhere to the CloudEventV1 interface", () => {
      const copy = CloudEvent.cloneWith(fixture, { data: { lunch: "tacos" } }, false);
      expect(copy.data.lunch).to.equal("tacos");
    });
  });
});
