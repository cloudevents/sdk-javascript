/* eslint-disable no-console */
import { CloudEvent, HTTP } from "cloudevents";

export function doSomeStuff(): void {
  const myevent: CloudEvent = new CloudEvent({
    source: "/source",
    type: "type",
    datacontenttype: "text/plain",
    dataschema: "https://d.schema.com/my.json",
    subject: "cha.json",
    data: "my-data",
    extension1: "some extension data",
  });

  console.log("My structured event:", myevent);

  // ------ receiver structured
  // The header names should be standarized to use lowercase
  const headers = {
    "content-type": "application/cloudevents+json",
  };

  // Typically used with an incoming HTTP request where myevent.format() is the actual
  // body of the HTTP
  console.log("Received structured event:", HTTP.toEvent({ headers, body: myevent }));

  // ------ receiver binary
  const data = {
    data: "dataString",
  };
  const attributes = {
    "ce-type": "type",
    "ce-specversion": "1.0",
    "ce-source": "source",
    "ce-id": "id",
    "ce-time": "2019-06-16T11:42:00Z",
    "ce-dataschema": "http://schema.registry/v1",
    "Content-Type": "application/json",
    "ce-extension1": "extension1",
  };

  console.log("My binary event:", HTTP.toEvent({ headers: attributes, body: data }));
  console.log("My binary event extensions:", HTTP.toEvent({ headers: attributes, body: data }));
}

doSomeStuff();
