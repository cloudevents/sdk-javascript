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
those are Node.js 16.x, and Node.js 18.x. To install in your Node.js project:

```console
npm install cloudevents
```

### Receiving and Emitting Events

#### Receiving Events

You can choose any popular web framework for port binding. A `CloudEvent`
object can be created by simply providing the `HTTP` protocol binding
the incoming headers and request body.

```js
const app = require("express")();
const { HTTP } = require("cloudevents");

app.post("/", (req, res) => {
  // body and headers come from an incoming HTTP request, e.g. express.js
  const receivedEvent = HTTP.toEvent({ headers: req.headers, body: req.body });
  console.log(receivedEvent);
});
```

#### Emitting Events

The easiest way to send events is to use the built-in HTTP emitter.

```js
const { httpTransport, emitterFor, CloudEvent } = require("cloudevents");

// Create an emitter to send events to a receiver
const emit = emitterFor(httpTransport("https://my.receiver.com/endpoint"));

// Create a new CloudEvent
const ce = new CloudEvent({ type, source, data });

// Send it to the endpoint - encoded as HTTP binary by default
emit(ce);
```

If you prefer to use another transport mechanism for sending events
over HTTP, you can use the `HTTP` binding to create a `Message` which
has properties for `headers` and `body`, allowing greater flexibility
and customization. For example, the `axios` module is used here to send
a CloudEvent.

```js
const axios = require("axios").default;
const { HTTP, CloudEvent } = require("cloudevents");

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
const axios = require("axios").default;
const { emitterFor, Mode, CloudEvent } = require("cloudevents");

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
emit(new CloudEvent({ type, source, data }));
```

You may also use the `Emitter` singleton to send your `CloudEvents`.

```js
const { emitterFor, httpTransport, Mode, CloudEvent, Emitter } = require("cloudevents");

// Create a CloudEvent emitter function to send events to our receiver
const emit = emitterFor(httpTransport("https://example.com/receiver"));

// Use the emit() function to send a CloudEvent to its endpoint when a "cloudevent" event is emitted
// (see: https://nodejs.org/api/events.html#class-eventemitter)
Emitter.on("cloudevent", emit);

...
// In any part of the code, calling `emit()` on a `CloudEvent` instance will send the event
new CloudEvent({ type, source, data }).emit();

// You can also have several listeners to send the event to several endpoints
```

## CloudEvent Objects

All created `CloudEvent` objects are read-only. If you need to update a property or add a new extension to an existing cloud event object, you can use the `cloneWith` method. This will return a new `CloudEvent` with any update or new properties. For example:

```js
const {
  CloudEvent,
} = require("cloudevents");

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
[CloudEvents `community`](https://github.com/cloudevents/spec/tree/master/community)
directory. In particular, in there you will find information concerning
how SDK projects are
[managed](https://github.com/cloudevents/spec/blob/master/community/SDK-GOVERNANCE.md),
[guidelines](https://github.com/cloudevents/spec/blob/master/community/SDK-maintainer-guidelines.md)
for how PR reviews and approval, and our
[Code of Conduct](https://github.com/cloudevents/spec/blob/master/community/GOVERNANCE.md#additional-information)
information.

If there is a security concern with one of the CloudEvents specifications, or
with one of the project's SDKs, please send an email to
[cncf-cloudevents-security@lists.cncf.io](mailto:cncf-cloudevents-security@lists.cncf.io).

## Additional SDK Resources

- [List of current active maintainers](MAINTAINERS.md)
- [How to contribute to the project](CONTRIBUTING.md)
- [SDK's License](LICENSE)
- [SDK's Release process](RELEASING.md)
