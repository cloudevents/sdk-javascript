/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from "chai";
import { Given, When, Then, World } from "cucumber";
import { Receiver } from "../../src";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HTTPParser } = require("http-parser-js");

const parser = new HTTPParser(HTTPParser.REQUEST);
const receiver = new Receiver();

Given("HTTP Protocol Binding is supported", function (this: World) {
  return true;
});

Given("an HTTP request", function (request: string) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const world = this;
  parser.onHeadersComplete = function (record: Record<string, []>) {
    world.headers = arrayToObject(record.headers);
  };
  parser.onBody = function (body: Buffer, offset: number) {
    world.body = body.slice(offset).toString();
  };
  parser.execute(Buffer.from(request), 0, request.length);
  return true;
});

When("parsed as HTTP request", function () {
  this.cloudevent = receiver.accept(this.headers, this.body);
  return true;
});

Then("the attributes are:", function (attributes: { rawTable: [] }) {
  const expected = tableToObject(attributes.rawTable);
  assert.equal(this.cloudevent.id, expected.id);
  assert.equal(this.cloudevent.type, expected.type);
  assert.equal(this.cloudevent.source, expected.source);
  assert.equal(this.cloudevent.time, new Date(expected.time).toISOString());
  assert.equal(this.cloudevent.specversion, expected.specversion);
  assert.equal(this.cloudevent.datacontenttype, expected.datacontenttype);
  return true;
});

Then("the data is equal to the following JSON:", function (json: string) {
  assert.deepEqual(this.cloudevent.data, JSON.parse(json));
  return true;
});

function arrayToObject(arr: []): Record<string, string> {
  const obj: Record<string, string> = {};
  // @ts-ignore
  return arr.reduce(({}, keyOrValue, index, arr) => {
    if (index % 2 === 0) {
      obj[keyOrValue] = arr[index + 1];
    }
    return obj;
  });
}

function tableToObject(table: []): Record<string, string> {
  const obj: Record<string, string> = {};
  // @ts-ignore
  return table.reduce(({}, [key, value]: Array<string, string>) => {
    obj[key] = value;
    return obj;
  });
}
