import Cloudevent, { event, StructuredHTTPEmitter, BinaryHTTPEmitter } from 'cloudevents-sdk/v1';

export function doSomeStuff() {

  const myevent: Cloudevent = event()
    .source('/source')
    .type('type')
    .dataContentType('text/plain')
    .dataschema('http://d.schema.com/my.json')
    .subject('cha.json')
    .data('my-data');

  console.log(myevent.format());

  let config = {
    method: "POST",
    url   : "https://enu90y24i64jp.x.pipedream.net/"
  };

  let structured = new StructuredHTTPEmitter(config);
  structured.emit(myevent).then(res => {
    // success
    console.log("Structured Mode: Success!")
  })
  .catch(err => {
    // error
    console.error(err);
  });

  let binary = new BinaryHTTPEmitter(config);
  binary.emit(myevent).then(res => {
    console.log("Binary Mode: Success!");
  })
  .catch(err => {
    console.error(err);
  });

  return true;
}

doSomeStuff();
