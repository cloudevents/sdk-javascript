import CloudEvent, {
  event,
  StructuredHTTPEmitter,
  BinaryHTTPEmitter,
  StructuredHTTPReceiver,
  BinaryHTTPReceiver
} from 'cloudevents-sdk/v1';

export function doSomeStuff() {

  const myevent: CloudEvent = event()
    .source('/source')
    .type('type')
    .dataContentType('text/plain')
    .dataschema('http://d.schema.com/my.json')
    .subject('cha.json')
    .data('my-data')
    .addExtension("my-ext", "0x600");

  console.log(myevent.toString());
  console.log(myevent.getExtensions());

  let config = {
    method: "POST",
    url   : "https://enu90y24i64jp.x.pipedream.net/"
  };

  // ------ emitter structured
  let structured = new StructuredHTTPEmitter(config);
  structured.emit(myevent).then(res => {
    // success
    console.log("Structured Mode: Success!")
  })
  .catch(err => {
    // error
    console.error(err);
  });

  // ------ emitter binary
  let binary = new BinaryHTTPEmitter(config);
  binary.emit(myevent).then(res => {
    console.log("Binary Mode: Success!");
  })
  .catch(err => {
    console.error(err);
  });

  // ------ receiver structured
  let payload = myevent.toString();
  let headers = {
    "Content-Type":"application/cloudevents+json"
  };

  let receiverStructured = new StructuredHTTPReceiver();
  console.log(receiverStructured.parse(payload, headers).toString());

  // ------ receiver binary
  let extension1 = "mycuston-ext1";
  let data = {
    "data" : "dataString"
  };
  var attributes = {
    "ce-type"        : "type",
    "ce-specversion" : "1.0",
    "ce-source"      : "source",
    "ce-id"          : "id",
    "ce-time"        : "2019-06-16T11:42:00Z",
    "ce-dataschema"  : "http://schema.registry/v1",
    "Content-Type"   : "application/json",
    "ce-extension1"  : extension1
  };

  let receiverBinary = new BinaryHTTPReceiver();
  console.log(receiverBinary.parse(data, attributes).toString());

return true;
}

doSomeStuff();
