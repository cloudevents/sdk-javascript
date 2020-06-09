import { CloudEvent, HTTPReceiver } from "cloudevents-sdk";
import { CloudEventV1 } from "cloudevents-sdk/lib/v1";

export function doSomeStuff() {
  const receiver = new HTTPReceiver();

  const myevent: CloudEventV1 = new CloudEvent({
    source: "/source",
    type: "type",
    dataContentType: "text/plain",
    dataSchema: "https://d.schema.com/my.json",
    subject: "cha.json",
    data: "my-data"
  });
  myevent.addExtension("extension-1", "some extension data");

  console.log("My structured event:", myevent.toString());
  console.log("My structured event extensions:", myevent.getExtensions());

  // ------ receiver structured
  // The header names should be standarized to use lowercase
  const headers = {
    "content-type": "application/cloudevents+json"
  };

  // Typically used with an incoming HTTP request where myevent.format() is the actual
  // body of the HTTP
  console.log("Received structured event:", receiver.accept(headers, myevent.format()).toString());

  // ------ receiver binary
  const data = {
    "data": "dataString"
  };
  const attributes = {
    "ce-type": "type",
    "ce-specversion": "1.0",
    "ce-source": "source",
    "ce-id": "id",
    "ce-time": "2019-06-16T11:42:00Z",
    "ce-dataschema": "http://schema.registry/v1",
    "Content-Type": "application/json",
    "ce-extension1": "extension1"
  };

  console.log("My binary event:", receiver.accept(attributes, data).toString());
  console.log("My binary event extensions:", receiver.accept(attributes, data).toString());

  return true;
}

doSomeStuff();
