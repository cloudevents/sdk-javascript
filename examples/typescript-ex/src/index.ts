import { CloudEvent, HTTPREceiver } from '../../';

export function doSomeStuff() {
  const receiver = new HTTPREceiver();

  const myevent: CloudEvent = new CloudEvent()
    .source('/source')
    .type('type')
    .dataContentType('text/plain')
    .dataschema('http://d.schema.com/my.json')
    .subject('cha.json')
    .data('my-data')
    .addExtension("my-ext", "0x600");

  console.log(myevent.toString());
  console.log(myevent.getExtensions());

  // ------ receiver structured
  const payload = myevent.toString();
  const headers = {
    "Content-Type":"application/cloudevents+json"
  };

  console.log(receiver.accept(headers, payload).toString());

  // ------ receiver binary
  const extension1 = "mycuston-ext1";
  const data = {
    "data" : "dataString"
  };
  const attributes = {
    "ce-type"        : "type",
    "ce-specversion" : "1.0",
    "ce-source"      : "source",
    "ce-id"          : "id",
    "ce-time"        : "2019-06-16T11:42:00Z",
    "ce-dataschema"  : "http://schema.registry/v1",
    "Content-Type"   : "application/json",
    "ce-extension1"  : extension1
  };

  console.log(receiver.accept(attributes, data).toString());

  return true;
}

doSomeStuff();
