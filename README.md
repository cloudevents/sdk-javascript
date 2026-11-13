# JavaScript SDK for CloudEvents

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/2e29a55fb4084ecca4642d72dc4c83d4)](https://www.codacy.com/gh/cloudevents/sdk-javascript/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/2e29a55fb4084ecca4642d72dc4c83d4)](https://www.codacy.com/gh/cloudevents/sdk-javascript/dashboard?utm_source=github.com&utm_medium=referral&utm_content=cloudevents/sdk-javascript&utm_campaign=Badge_Coverage)
![Node.js CI](https://github.com/cloudevents/sdk-javascript/workflows/Node.js%20CI/badge.svg)
[![npm version](https://img.shields.io/npm/v/cloudevents.svg)](https://www.npmjs.com/package/cloudevents)
[![vulnerabilities](https://snyk.io/test/github/cloudevents/sdk-javascript/badge.svg)](https://snyk.io/test/github/cloudevents/sdk-javascript)

The CloudEvents SDK for JavaScript.

## Features

- Represent CloudEvents in memory
- Serialize and deserialize CloudEvents in different [event formats](https://github.com/cloudevents/spec/blob/v1.0/spec.md#event-format).
- Send and receive CloudEvents with via different [protocol bindings](https://github.com/cloudevents/spec/blob/v1.0/spec.md#protocol-binding).

_Note:_ Supports CloudEvent version 1.0

## Installation

The CloudEvents SDK requires a current LTS version of Node.js. At the moment
those are Node.js 22.x, and Node.js 24.x. To install in your Node.js project:

```console
npm install cloudevents
```

The examples below use ECMAScript modules; CommonJS applications can use
`require("cloudevents")` instead.

### Receiving and Emitting Events

#### Receiving Events

You can choose any popular web framework for port binding. A `CloudEvent`
object can be created by simply providing the `HTTP` protocol binding
the incoming headers and request body.

```js
import express from "express";
import { HTTP } from "cloudevents";

const app = express();

app.post("/", (req, res) => {
  // body and headers come from an incoming HTTP request, e.g. express.js
  const receivedEvent = HTTP.toEvent({ headers: req.headers, body: req.body });
  console.log(receivedEvent);
});
```

#### Emitting Events

The easiest way to send events is to use the built-in HTTP emitter, which sends
them with the Fetch API.

```js
import { CloudEvent, emitterFor, httpTransport } from "cloudevents";

// Create an emitter to send events to a receiver
const emit = emitterFor(httpTransport("https://my.receiver.com/endpoint"));

// Create a new CloudEvent
const ce = new CloudEvent({ type, source, data });

async function main() {
  // Send it to the endpoint - encoded as HTTP binary by default
  const { response, body } = await emit(ce);
  console.log(response.status, body);
}

main().catch(console.error);
```

A 2xx response resolves with the native Fetch `Response` and its body, read as
text by default. Anything else rejects with an `HTTPTransportError`, whose
`kind` separates a response that was not 2xx from an abort and from a request
that never reached a response.

The body of a response that was not 2xx is on the error as `error.body`.
`error.response` cannot be read a second time. If reading the body failed,
`error.body` is absent and the error carries a `cause`.

```js
import { HTTPTransportError } from "cloudevents";

async function main() {
  try {
    await emit(ce);
  } catch (error) {
    if (error instanceof HTTPTransportError) {
      console.error(error.kind, error.response?.status, error.body);
    }
    throw error;
  }
}

main().catch(console.error);
```

`httpTransport()` also takes the headers for every event, a
`responseHandler` to read the body another way, and the remaining Fetch options
under `fetchOptions`. The options passed to `emit()` apply to that Message only:
`headers` and `signal`. Unsupported transport or message options reject with a
`TypeError`. To discard a response body, use
`responseHandler: async (response) => { await response.body?.cancel(); }`.

Existing `ce-*` and `content-type` headers cannot be changed. New CloudEvents
headers must be valid and, in structured mode, match the body.

Other headers, such as `authorization`, `traceparent` and `baggage`, can be added
or overridden. `host` and `content-length` are controlled by Fetch and are
rejected. Invalid headers reject with a `TypeError` before the request is sent.

There is no timeout option: a deadline is an `AbortSignal` passed with the
message.

```js
const emit = emitterFor(httpTransport("https://my.receiver.com/endpoint", {
  headers: { authorization: `Bearer ${process.env.RECEIVER_TOKEN}` },
  responseHandler: (response) => response.json(),
}));

async function main() {
  await emit(ce, { signal: AbortSignal.timeout(10000) });
}

main().catch(console.error);
```

A 2xx response means the receiver accepted the event, so a body that cannot be
read resolves with `{ response, bodyError }` in place of `{ response, body }`.
Only one of the two is present. Check which property the result has before using
it:

```js
async function main() {
  const result = await emit(ce);
  if ("body" in result) {
    console.log(result.body);
  } else {
    console.error(result.bodyError);
  }
}

main().catch(console.error);
```

Redirects are not followed by default, so each one is reported as a failed send.
On Node.js the `HTTPTransportError` carries the 3xx response; a browser returns
an opaque redirect instead, so `error.response.status` is `0` and the `location`
header cannot be read. Set `fetchOptions: { redirect: "follow" }` to follow
them, keeping in mind that Fetch preserves the CloudEvent POST and its body only
for `307` and `308` - it turns a `301`, `302` or `303` into a bodyless `GET`,
which drops the event.

The [API transition guide](./API_TRANSITION_GUIDE.md) covers the header forms
the transport accepts and where a proxy or a custom CA goes now that
`http.globalAgent` no longer applies.

If you prefer to use another transport mechanism for sending events
over HTTP, you can use the `HTTP` binding to create a `Message` which
has properties for `headers` and `body`, allowing greater flexibility
and customization. For example, the `axios` module is used here to send
a CloudEvent.

```js
import axios from "axios";
import { CloudEvent, HTTP } from "cloudevents";

const ce = new CloudEvent({ type, source, data });
const message = HTTP.binary(ce); // Or HTTP.structured(ce)

axios({
  method: "post",
  url: "...",
  data: message.body,
  headers: message.headers,
});
```

You may also use the `emitterFor()` function as a convenience.

```js
import axios from "axios";
import { CloudEvent, emitterFor, Mode } from "cloudevents";

function sendWithAxios(message) {
  // Do what you need with the message headers
  // and body in this function, then send the
  // event. Return the promise so that `await emit(event)`
  // waits for the send and rejects if it fails.
  return axios({
    method: "post",
    url: "...",
    data: message.body,
    headers: message.headers,
  });
}

const emit = emitterFor(sendWithAxios, { mode: Mode.BINARY });
emit(new CloudEvent({ type, source, data }));
```

You may also use the `Emitter` singleton to send your `CloudEvents`.

```js
import {
  CloudEvent,
  Emitter,
  emitterFor,
  httpTransport,
  Mode,
} from "cloudevents";

async function main() {
  // Create a CloudEvent emitter function to send events to our receiver
  const emit = emitterFor(httpTransport("https://example.com/receiver"));

  // Use the emit() function to send a CloudEvent to its endpoint when a
  // "cloudevent" event is emitted
  // (see: https://nodejs.org/api/events.html#class-eventemitter)
  Emitter.on("cloudevent", emit);

  // Calling emit() on a CloudEvent instance sends it through every listener
  await new CloudEvent({
    type: "com.example.order.created",
    source: "/stores/store-42",
    data: { orderId: "order-123" },
  }).emit();
}

main().catch(console.error);
```

You can also have several listeners to send the event to several endpoints.
`emit()` waits for all of them, and an endpoint which refuses the event fails
the whole call. See the [API transition guide](./API_TRANSITION_GUIDE.md) for
the details.

## CloudEvent Objects

All created `CloudEvent` objects are read-only. If you need to update a property or add a new extension to an existing cloud event object, you can use the `cloneWith` method. This will return a new `CloudEvent` with any update or new properties. For example:

```js
import { CloudEvent } from "cloudevents";

// Create a new CloudEvent
const ce = new CloudEvent({...});

// Add a new extension to an existing CloudEvent
const ce2 = ce.cloneWith({extension: "Value"});
```

You can create a `CloudEvent` object in many ways, for example, in TypeScript:

```ts
import { CloudEvent, CloudEventV1, CloudEventV1Attributes } from "cloudevents";
const ce: CloudEventV1<string> = {
  specversion: "1.0",
  source: "/some/source",
  type: "example",
  id: "1234"
};
const event = new CloudEvent(ce);
const ce2: CloudEventV1Attributes<string> = {
  specversion: "1.0",
  source: "/some/source",
  type: "example",
};
const event2 = new CloudEvent(ce2);
const event3 = new CloudEvent({
  source: "/some/source",
  type: "example",
});
```

### Extension Attributes

Any property passed to the `CloudEvent` constructor that is not a core attribute becomes an
[extension attribute](https://github.com/cloudevents/spec/blob/v1.0/spec.md#extension-context-attributes).
In binary mode each extension is sent as its own header, named after the attribute with the
transport's prefix: an extension `traceid` becomes the `ce-traceid` HTTP header. Extension names
must be lowercase letters and digits only.

Extension values should be one of the CloudEvents types: string, boolean, integer, binary, URI or
timestamp. The spec has no object type, so encode structured data as a string yourself:

```js
const ce = new CloudEvent({
  source: "/orders",
  type: "order.placed",
  traceinfo: JSON.stringify({ span: "abc", sampled: true }),
});
```

`Date` values are sent as RFC 3339 timestamps and binary values (`Buffer`, typed arrays) as base64, which
are the string forms the spec requires.

As a convenience the SDK also accepts a plain object or array as an extension value and serializes it as JSON
when the event is sent in binary mode. This is not spec-conformant: a receiver gets a plain string
and has to know to parse it, and other SDKs may reject the event. Prefer the explicit form above.

### Tracing with OpenTelemetry

`cloudevents/otel` adds spans, metrics and exception logs to event sending and processing.
Install the peer dependencies and initialize OpenTelemetry in your application before using the helpers:

```console
npm install @opentelemetry/api @opentelemetry/api-logs @opentelemetry/core
```

Wrap an emitter with `withTracing()`. Set `system` to the messaging system's name and
`destination` to a fixed topic or queue name:

```js
import { CloudEvent, emitterFor, httpTransport } from "cloudevents";
import { withTracing } from "cloudevents/otel";

const emitter = emitterFor(httpTransport("https://broker.example.com/orders"));
const emit = withTracing(emitter, {
  system: "example-broker",
  destination: "orders",
});

await emit(new CloudEvent({
  type: "com.example.order.created",
  source: "/stores/store-42",
  data: { orderId: "order-123" },
}));
```

For destinations whose names vary by tenant, use a template. Spans record the actual name;
span names and metrics use the template:

```js
const emit = withTracing(emitter, {
  system: "example-broker",
  destination: { name: "orders.tenant-42", template: "orders.{tenant}" },
});
```

The send span's context is propagated through headers and added to the event's
[Distributed Tracing](https://github.com/cloudevents/spec/blob/main/cloudevents/extensions/distributed-tracing.md)
extension when no valid one exists. An existing context is preserved, and the send span links to it.

Use `receiverWithTracing()` to decode HTTP messages and trace the handler:

```js
import express from "express";
import { receiverWithTracing } from "cloudevents/otel";

const receive = receiverWithTracing(async (events) => {
  for (const event of Array.isArray(events) ? events : [events]) {
    await saveOrder(event.data);
  }
}, { system: "example-broker", destination: "orders" });

const app = express();

// Pass the raw body to receiverWithTracing().
app.post("/", express.text({ type: "*/*" }), async (req, res, next) => {
  try {
    await receive({ headers: req.headers, body: req.body });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
```

The handler receives a CloudEvent or an array for a batch. Use `binding: Kafka` for Kafka
messages, or `handlerWithTracing()` when events are already decoded.

### A Note About Big Integers

When parsing JSON data, if a JSON field value is a number, and that number
is really big, JavaScript loses precision. For example, the Twitter API exposes
the Tweet ID. This is a large number that exceeds the integer space of `Number`.

In order to address this situation, you can set the environment variable
`CE_USE_BIG_INT` to the string value `"true"` to enable the use of the
[`json-bigint`](https://www.npmjs.com/package/json-bigint) package. This
package is not used by default due to the resulting slowdown in parse speed
by a factor of 7x.

See for more information: https://github.com/cloudevents/sdk-javascript/issues/489

### Example Applications

There are a few trivial example applications in
[the examples folder](https://github.com/cloudevents/sdk-javascript/tree/main/examples).
There you will find Express.js, TypeScript and Websocket examples.


### API Transition Guide

[Guide Link](./API_TRANSITION_GUIDE.md)

## Supported specification features

| Core Specification | [v0.3](https://github.com/cloudevents/spec/blob/v0.3/spec.md) | [v1.0](https://github.com/cloudevents/spec/blob/v1.0/spec.md) |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| CloudEvents Core   | :white_check_mark:                                            | :white_check_mark:                                            |

---

| Event Formats     | [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/blob/v1.0/spec.md#event-format) |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| AVRO Event Format | :x:                                                   | :x:                                                   |
| JSON Event Format | :white_check_mark:                                    | :white_check_mark:                                    |

---

| Protocol Bindings    | [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/blob/v1.0/spec.md#protocol-binding) |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| AMQP Protocol Binding  | :x:                                                   | :x:                                                   |
| HTTP Protocol Binding  | :white_check_mark:                                    | :white_check_mark:                                    |
| Kafka Protocol Binding | :x:                                                   | :white_check_mark:                                                   |
| MQTT Protocol Binding  | :white_check_mark:                                                   | :x:                                                   |
| NATS Protocol Binding  | :x:                                                   | :x:                                                   |

---

| Content Modes    | [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/blob/v1.0/http-protocol-binding.md#13-content-modes) |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| HTTP Binary  | :white_check_mark:                                                   | :white_check_mark:                                                   |
| HTTP Structured  | :white_check_mark:                                    | :white_check_mark:                                    |
| HTTP Batch  | :white_check_mark:                                    | :white_check_mark:                                    |
| Kafka Binary  | :white_check_mark:                                                   | :white_check_mark:                                                   |
| Kafka Structured  | :white_check_mark:                                    | :white_check_mark:                                    |
| Kafka Batch  | :white_check_mark:                                    | :white_check_mark:
| MQTT Binary  | :white_check_mark:                                                   | :white_check_mark:                                                   |
| MQTT Structured  | :white_check_mark:                                    | :white_check_mark:                                    |

## Community

- There are bi-weekly calls immediately following the [Serverless/CloudEvents
  call](https://github.com/cloudevents/spec#meeting-time) at
  9am PT (US Pacific). Which means they will typically start at 10am PT, but
  if the other call ends early then the SDK call will start early as well.
  See the [CloudEvents meeting minutes](https://docs.google.com/document/d/1OVF68rpuPK5shIHILK9JOqlZBbfe91RNzQ7u_P7YCDE/edit#)
  to determine which week will have the call.
- Slack: #cloudeventssdk channel under
  [CNCF's Slack workspace](https://slack.cncf.io/).
- Email: https://lists.cncf.io/g/cncf-cloudevents-sdk

## Maintainers

Currently active maintainers who may be found in the CNCF Slack.

- Lance Ball (@lance)
- Lucas Holmquist (@lholmquist)

## Contributing

We love contributions from the community! Please check the
[Contributor's Guide](https://github.com/cloudevents/sdk-javascript/blob/main/CONTRIBUTING.md)
for information on how to get involved.

Each SDK may have its own unique processes, tooling and guidelines, common
governance related material can be found in the
[CloudEvents `docs`](https://github.com/cloudevents/spec/tree/main/docs)
directory. In particular, in there you will find information concerning
how SDK projects are
[managed](https://github.com/cloudevents/spec/blob/main/docs/SDK-GOVERNANCE.md),
[guidelines](https://github.com/cloudevents/spec/blob/main/docs/SDK-maintainer-guidelines.md)
for how PR reviews and approval, and our
[Code of Conduct](https://github.com/cloudevents/spec/blob/main/docs/GOVERNANCE.md#additional-information)
information.

If there is a security concern with one of the CloudEvents specifications, or
with one of the project's SDKs, please send an email to
[cncf-cloudevents-security@lists.cncf.io](mailto:cncf-cloudevents-security@lists.cncf.io).

## Additional SDK Resources

- [List of current active maintainers](MAINTAINERS.md)
- [How to contribute to the project](CONTRIBUTING.md)
- [SDK's License](LICENSE)
- [SDK's Release process](RELEASING.md)
