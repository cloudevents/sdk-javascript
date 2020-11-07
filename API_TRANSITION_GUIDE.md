## Deprecated API Transition Guide

When APIs are deprecated, the following guide will show how to transition from removed APIs to the new ones


### Upgrading From 3.x to 4.0

In the 3.2.0 release, a few APIs were set to be deprecated in the 4.0 release.  With the release of 4.0.0,  those APIs have been removed.

#### Receiever

The `Receiver` class has been removed.

`Receiver.accept` should be transitioned to `HTTP.toEvent`

Here is an example of what a `HTTP.toEvent` might look like using Express.js

```js
const app = require("express")();
const { HTTP } = require("cloudevents");

app.post("/", (req, res) => {
  // body and headers come from an incoming HTTP request, e.g. express.js
  const receivedEvent = HTTP.toEvent({ headers: req.headers, body: req.body });
  console.log(receivedEvent);
});
```

#### Emitter

`Emit.send` should be transitioned to `HTTP.binary` for binary events and `HTTP.structured` for structured events

`Emit.send` would use axios to emit the events.  Since this now longer available, you are free to choose your own transport protocol.

So for axios,  it might look something like this:

```js
const axios = require('axios').default;
const { HTTP } = require("cloudevents");


const ce = new CloudEvent({ type, source, data })
const message = HTTP.binary(ce); // Or HTTP.structured(ce)

axios({
  method: 'post',
  url: '...',
  data: message.body,
  headers: message.headers,
});
```

You may also use the `emitterFor()` function as a convenience.

```js
const axios = require('axios').default;
const { emitterFor, Mode } = require("cloudevents");

function sendWithAxios(message) {
  // Do what you need with the message headers
  // and body in this function, then send the
  // event
  axios({
    method: 'post',
    url: '...',
    data: message.body,
    headers: message.headers,
  });
}

const emit = emitterFor(sendWithAxios, { mode: Mode.BINARY });
emit(new CloudEvent({ type, source, data }));
```

You may also use the `Emitter` singleton

```js
const axios = require("axios").default;
const { emitterFor, Mode, CloudEvent, Emitter } = require("cloudevents");

function sendWithAxios(message) {
  // Do what you need with the message headers
  // and body in this function, then send the
  // event
  axios({
    method: "post",
    url: "...",
    data: message.body,
    headers: message.headers,
  });
}

const emit = emitterFor(sendWithAxios, { mode: Mode.BINARY });
// Set the emit
Emitter.on("cloudevent", emit);

...
// In any part of the code will send the event
new CloudEvent({ type, source, data }).emit();

// You can also have several listener to send the event to several endpoint
```
