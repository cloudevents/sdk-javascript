/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { expect } from "chai";
import { CloudEvent, HTTP, Message } from "../../src";
import { Kafka, KafkaMessage } from "../../src/message";

const type = "org.cncf.cloudevents.example";
const source = "http://unit.test";

// Create a bunch of cloudevents that we can bunch together in a batch
const fixture: any[] = [];
for (let id = 0; id < 10; id++) {
  fixture.push(
    new CloudEvent({
      id: `${id}`,
      source,
      type,
    }),
  );
}

/**
 * A basic test to validate that we can handle simple batch mode
 */
describe("A batched CloudEvent message over HTTP", () => {
  it("Can be created with a typed Message", () => {
    const message: Message = {
      headers: {
        "content-type": "application/cloudevents-batch+json",
      },
      body: JSON.stringify(fixture),
    };
    const batch = HTTP.toEvent(message);
    expect(batch.length).to.equal(10);
    const ce = (batch as CloudEvent<any>[])[0];
    expect(typeof ce).to.equal("object");
    expect(ce.constructor.name).to.equal("CloudEvent");
  });
});

describe("A batched CloudEvent message over Kafka", () => {
  it("Can be created with a typed Message", () => {
    const value = JSON.stringify(fixture);
    const message: KafkaMessage = {
      key: "123",
      value,
      headers: {
        "content-type": "application/cloudevents-batch+json",
      },
      body: value,
    };
    const batch = Kafka.toEvent(message);
    expect(batch.length).to.equal(10);
    const ce = (batch as CloudEvent<any>[])[0];
    expect(typeof ce).to.equal("object");
    expect(ce.constructor.name).to.equal("CloudEvent");
  });
});
