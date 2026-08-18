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

### Upgrading From 10.x to 11.0

In the 11.0.0 release, the built-in HTTP transport was rewritten on top of the Fetch API.

#### HTTP Transport

`httpTransport()` used to resolve with the response for every status code, so a receiver
that rejected an event looked just like one that accepted it.

```js
import { CloudEvent, emitterFor, httpTransport } from "cloudevents";

const emit = emitterFor(httpTransport("https://my.receiver.com/endpoint"));

// resolved with { body, headers } whether the receiver returned 202 or 503
const response = await emit(new CloudEvent({ type, source, data }));
```

A 2xx response now resolves with the native Fetch `Response` and its body as text, and
anything else rejects with an `HTTPTransportError`.

```js
import {
  CloudEvent,
  emitterFor,
  HTTPTransportError,
  httpTransport,
} from "cloudevents";

const emit = emitterFor(httpTransport("https://my.receiver.com/endpoint"));

try {
  const { response, body } = await emit(new CloudEvent({ type, source, data }));
  console.log(response.status, body);
} catch (error) {
  if (error instanceof HTTPTransportError) {
    console.error(error.kind, error.response?.status);
  }
  throw error;
}
```

The transport takes a second argument now, for headers, a signal, how the response body
is read and, under `fetchOptions`, the other Fetch options. Its headers are Fetch header
forms, so a `string[]` value becomes a `Headers` you `append()` to. A redirect is a
failed send unless `fetchOptions: { redirect: "follow" }` says otherwise, and a body
that cannot be read after a 2xx resolves with `bodyError` in place of `body`. The
signal given to `httpTransport()` lasts as long as the transport, so a per-request
deadline belongs on the signal passed with the event.

```js
const headers = new Headers();
headers.append("accept", "application/cloudevents+json");
headers.append("accept", "application/json");
await emit(new CloudEvent({ type, source, data }), { headers });
```

#### The Emitter Singleton

A listener registered with `Emitter.on("cloudevent", emit)` now returns a promise which
rejects for a receiver that did not accept the event. `emitEvent()` awaits those promises
by default, so the rejection reaches whoever called `emit()` on the event:

```js
try {
  await new CloudEvent({ type, source, data }).emit();
} catch (error) {
  console.error(error.kind, error.response?.status);
}
```

With `ensureDelivery` turned off, the listeners run through `EventEmitter`, which discards
what they return. A rejection there becomes an unhandled promise rejection, which a `503`
could not produce before. Leave `ensureDelivery` alone, or catch inside the listener:

```js
Emitter.on("cloudevent", (event) => emit(event).catch(reportFailedDelivery));

// listeners are not awaited, so nothing else can catch what they reject with
new CloudEvent({ type, source, data }).emit(false);
```

#### Proxies, Custom CAs, mTLS and Connection Pooling

The old transport went through Node.js `http.request()` or `https.request()`, so a proxy
library or connection options set on `http.globalAgent` or `https.globalAgent` reached
the corresponding requests. Fetch does not use those agents; on Node.js the equivalent
is a dispatcher from [undici](https://www.npmjs.com/package/undici), which `fetchOptions`
passes through:

```js
import { emitterFor, httpTransport } from "cloudevents";
import { ProxyAgent } from "undici";

const emit = emitterFor(httpTransport("https://my.receiver.com/endpoint", {
  fetchOptions: { dispatcher: new ProxyAgent("http://proxy.example.com:3128") },
}));
```

For example, an order service that presents a client certificate to an events receiver
and trusts the receiver's private CA can use an `Agent`:

```js
import { readFileSync } from "node:fs";
import { emitterFor, httpTransport } from "cloudevents";
import { Agent } from "undici";

const dispatcher = new Agent({
  connect: {
    cert: readFileSync("./certs/order-service-client.pem"),
    key: readFileSync("./certs/order-service-client-key.pem"),
    ca: readFileSync("./certs/events-receiver-ca.pem"),
  },
});

const emit = emitterFor(httpTransport("https://events.example.com/orders", {
  fetchOptions: { dispatcher },
}));
```

The `cert` and `key` identify the client when the receiver requires mTLS. The `ca`
controls which server certificates the client trusts, so it is needed here because the
receiver uses a private CA; it is separate from client authentication. An `Agent` also
tunes connection pooling, and `undici.setGlobalDispatcher()` applies to every send rather
than one transport. In the browser the platform handles proxies, certificates and trust,
so `dispatcher` is a Node.js-only option.

`fetchOptions` takes the Fetch options of whichever declarations type `fetch` in your
project, so TypeScript accepts `dispatcher` only where those are undici's. Against the
DOM `RequestInit` most projects compile with, pass it as
`fetchOptions: { dispatcher } as FetchRequestInit` or reach for
`setGlobalDispatcher()` instead.

#### Emitter Options

`Options` now declares `headers` and `signal` instead of leaving them to an index
signature that resolved to `unknown`. Its default header type remains the
CloudEvent header record used by custom transports. The emitter returned from
`httpTransport()` specializes it to `FetchHeadersInit`.

TypeScript now rejects spreading custom transport options into a client
configuration that types its own `headers`:

```ts
// merge the headers of one send over the ones the binding produced
function sendWithAxios(message: Message, options?: Options) {
  const { headers, ...rest } = options ?? {};
  return axios.post(url, message.body, {
    headers: { ...message.headers, ...headers } as AxiosRequestHeaders,
    ...rest,
  });
}
```

It also rejects the generic types as annotations for the built-in transport, whose
options are narrower. Use `HTTPTransportFunction` and `HTTPEmitterFunction`, or leave
the types to inference:

```ts
const transport: HTTPTransportFunction = httpTransport(sink);
const emit: HTTPEmitterFunction = emitterFor(transport);
```
