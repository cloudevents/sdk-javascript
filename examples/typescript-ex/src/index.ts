import Cloudevent, { event, StructuredHTTPEmitter } from 'cloudevents-sdk/v1';

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

  let emitter = new StructuredHTTPEmitter(config);
  emitter.emit(myevent).then(res => {
    // success
    console.log("Success!")
  })
  .catch(err => {
    // error
    console.error(err);
  })

  return true;
}

doSomeStuff();
