# JavaScript SDK for CloudEvents

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&utm_medium=referral&utm_content=cloudevents/sdk-javascript&utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&utm_medium=referral&utm_content=cloudevents/sdk-javascript&utm_campaign=Badge_Coverage)
![Node.js CI](https://github.com/cloudevents/sdk-javascript/workflows/Node.js%20CI/badge.svg)
[![npm version](https://img.shields.io/npm/v/cloudevents.svg)](https://www.npmjs.com/package/cloudevents)
[![vulnerabilities](https://snyk.io/test/github/cloudevents/sdk-javascript/badge.svg)](https://snyk.io/test/github/cloudevents/sdk-javascript)

The CloudEvents SDK for JavaScript.

## Features

- Represent CloudEvents in memory
- Serialize and deserialize CloudEvents in different [event formats](https://github.com/cloudevents/spec/blob/v1.0/spec.md#event-format).
- Send and recieve CloudEvents with via different [protocol bindings](https://github.com/cloudevents/spec/blob/v1.0/spec.md#protocol-binding).

_Note:_ Supports CloudEvent versions 0.3, 1.0

## Installation

The CloudEvents SDK requires a current LTS version of Node.js. At the moment
those are Node.js 10.x and Node.js 12.x. To install in your Node.js project:

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

You can send events over HTTP in either binary or structured format
using the `HTTP` binding to create a `Message` which has properties
for `headers` and `body`.

```js
const axios = require("axios").default;
const { HTTP } = require("cloudevents");

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
const { emitterFor, Mode } = require("cloudevents");

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

### Example Applications

There are a few trivial example applications in
[the examples folder](https://github.com/cloudevents/sdk-javascript/tree/main/examples).
There you will find Express.js, TypeScript and Websocket examples.


### API Transition Guide

[Guide Link](./API_TRANSITION_GUIDE.md)

## Supported specification features

| Core Specification | [v0.3](https://github.com/cloudevents/spec/blob/v0.3/spec.md) | [v1.0](https://github.com/cloudevents/spec/blob/v1.0/spec.md) |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| CloudEvents Core   | :heavy_check_mark:                                            | :heavy_check_mark:                                            |

---

| Event Formats     | [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/tree/v1.0) |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| AVRO Event Format | :x:                                                   | :x:                                                   |
| JSON Event Format | :heavy_check_mark:                                    | :heavy_check_mark:                                    |

---

| Transport Protocols    | [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/tree/v1.0) |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| AMQP Protocol Binding  | :x:                                                   | :x:                                                   |
| HTTP Protocol Binding  | :heavy_check_mark:                                    | :heavy_check_mark:                                    |
| Kafka Protocol Binding | :x:                                                   | :x:                                                   |
| MQTT Protocol Binding  | :x:                                                   | :x:                                                   |
| NATS Protocol Binding  | :x:                                                   | :x:                                                   |

## Community

- There are bi-weekly calls immediately following the [Serverless/CloudEvents
  call](https://github.com/cloudevents/spec#meeting-time) at
  9am PT (US Pacific). Which means they will typically start at 10am PT, but
  if the other call ends early then the SDK call will start early as well.
  See the [CloudEvents meeting minutes](https://docs.google.com/document/d/1OVF68rpuPK5shIHILK9JOqlZBbfe91RNzQ7u_P7YCDE/edit#)
  to determine which week will have the call.
- Slack: #cloudeventssdk channel under
  [CNCF's Slack workspace](https://slack.cncf.io/).
- Maintainers typically available on Slack
  - Lance Ball
  - Lucas Holmquist
  - Grant Timmerman
- Email: https://lists.cncf.io/g/cncf-cloudevents-sdk

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
