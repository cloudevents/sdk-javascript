# JavaScript SDK for CloudEvents

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Coverage)
![Node.js CI](https://github.com/cloudevents/sdk-javascript/workflows/Node.js%20CI/badge.svg)
[![npm version](https://img.shields.io/npm/v/cloudevents.svg)](https://www.npmjs.com/package/cloudevents)
[![vulnerabilities](https://snyk.io/test/github/cloudevents/sdk-javascript/badge.svg)](https://snyk.io/test/github/cloudevents/sdk-javascript)

The CloudEvents SDK for JavaScript.

## Features

* Represent CloudEvents in memory
* Serialize and deserialize CloudEvents in different [event formats](https://github.com/cloudevents/spec/blob/v1.0/spec.md#event-format).
* Send and recieve CloudEvents with via different [protocol bindings](https://github.com/cloudevents/spec/blob/v1.0/spec.md#protocol-binding).

_Note:_ Supports CloudEvent versions 0.3, 1.0

## Installation

The CloudEvents SDK requires a current LTS version of Node.js. At the moment
those are Node.js 10.x and Node.js 12.x. To install in your Node.js project:

```console
npm install cloudevents
```

### Receiving and Emitting Events

#### Receiving Events

You can choose almost any popular web framework for port binding. Use a
`Receiver` to process the incoming HTTP request. The receiver accepts
binary and structured events in either the 1.0 or 0.3 protocol formats.

```js
const app = require("express")();
const {Receiver} = require("cloudevents");

app.post("/", (req, res) => {
  // body and headers come from an incoming HTTP request, e.g. express.js
  const receivedEvent = Receiver.accept(req.headers, req.body);
  console.log(receivedEvent);
});
```

#### Emitting Events

You can send events over HTTP in either binary or structured format.

By default, the `Emitter` will emit events over HTTP POST using the
binary transport protocol. The `Emitter` will examine the `specversion`
of the event being sent, and use the appropriate protocol version. To send
structured events, add `Protocol.HTTPStructured` as a parameter to
`emitter.send()`.

```js
const { CloudEvent, Emitter, Protocol, Version } = require("cloudevents");

// With only an endpoint URL, this creates a v1 emitter
const emitter = new Emitter({
  url: "https://cloudevents.io/example"
});
const event = new CloudEvent({
  type, source, data
});

// By default, the emitter will send binary events
emitter.send(event).then((response) => {
    // handle the response
  }).catch(console.error);

// To send a structured event, just add that as an option
emitter.send(event, { protocol: Protocol.HTTPStructured })
  .then((response) => {
    // handle the response
  }).catch(console.error);

// To send an event to an alternate URL, add that as an option
emitter.send(event, { url: "https://alternate.com/api" })
  .then((response) => {
    // handle the response
  }).catch(console.error);

// Sending a v0.3 event works the same, If your event has a
// specversion property of Version.V03, then it will be sent
// using the 0.3 transport protocol
emitter.send(new CloudEvent({ specversion: Version.V03, source, type }))
  .then((response) => {
    // handle the response
  }).catch(console.error);
```

## CloudEvent Objects

All created `CloudEvent` objects are read-only.  If you need to update a property or add a new extension to an existing cloud event object, you can use the `cloneWith` method.  This will return a new `CloudEvent` with any update or new properties.  For example:

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

## Supported specification features

| Core Specification |  [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/tree/v1.0) |
| ----------------------------- | --- | --- |
| CloudEvents Core              | :heavy_check_mark: | :heavy_check_mark: |
---

| Event Formats |  [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/tree/v1.0) |
| ----------------------------- | --- | --- |
| AVRO Event Format             | :x: | :x: |
| JSON Event Format             | :heavy_check_mark: | :heavy_check_mark: |
---

| Transport Protocols |  [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/tree/v1.0) |
| ----------------------------- | --- | --- |
| AMQP Protocol Binding         | :x: | :x: |
| HTTP Protocol Binding         | :heavy_check_mark: | :heavy_check_mark: |
| Kafka Protocol Binding        | :x: | :x: |
| MQTT Protocol Binding         | :x: | :x: |
| NATS Protocol Binding         | :x: | :x: |

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
- Contact for additional information: Fabio José (`@fabiojose` on slack).

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
