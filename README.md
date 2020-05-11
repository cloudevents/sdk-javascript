# JavaScript SDK for CloudEvents

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Coverage)
[![Build Status](https://travis-ci.org/cloudevents/sdk-javascript.svg?branch=master)](https://travis-ci.org/cloudevents/sdk-javascript)
[![npm version](https://img.shields.io/npm/v/cloudevents-sdk.svg)](https://www.npmjs.com/package/cloudevents-sdk)
[![vulnerabilities](https://snyk.io/test/github/cloudevents/sdk-javascript/badge.svg)](https://snyk.io/test/github/cloudevents/sdk-javascript)
[![licence](https://img.shields.io/github/license/cloudevents/sdk-javascript)](http://www.apache.org/licenses/LICENSE-2.0)


The CloudEvents SDK for JavaScript.

This module will help you to:

* Represent CloudEvents in memory
* Use [Event Formats](https://github.com/cloudevents/spec/blob/v1.0/spec.md#event-format) to serialize/deserialize CloudEvents
* Use [Protocol Bindings](https://github.com/cloudevents/spec/blob/v1.0/spec.md#protocol-binding) to send/receive CloudEvents

_Note:_ Supported
[CloudEvents specification](https://github.com/cloudevents/spec): 0.3, 1.0

### A Note on Versioning

The CloudEvents protocol version is distinct from this module's version number.
For example, this module may be versioned as v2.0.0 but support the v0.3 and v1.0
versions of the CloudEvent specification.

## Usage

**See the full working example: [here](./examples/express-ex).**

### Installation

The CloudEvents SDK requires a current LTS version of Node.js. At the moment
those are Node.js 10.x and Node.js 12.x. To install in your Node.js project:

```console
npm install --save cloudevents-sdk
```

### Receiving and Emitting Events

#### Receiving Events

You can choose almost any popular web framework for port binding. Use an
`HTTPReceiver` to process the incoming HTTP request. The receiver accepts
binary and structured events in either the 1.0 or 0.3 protocol formats.

```js
const {
  CloudEvent,
  HTTPReceiever
} = require("cloudevents-sdk");

// Create a receiver to accept events over HTTP
const receiver = new HTTPReceiver();

// body and headers come from an incoming HTTP request, e.g. express.js
const receivedEvent = receiver.accept(req.body, req.headers);
console.log(receivedEvent.format());
```

#### Emitting Events

Currently, to emit events, you'll need to decide whether the event is in
binary or structured format, and determine what version of the CloudEvents
specification you want to send the event as.

```js
const { CloudEvent } = require("cloudevents-sdk");
const { StructuredHTTPEmitter } = require("cloudevents-sdk/v1");

const myevent = new CloudEvent()
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resource/123");

const emitter = new StructuredHTTPEmitter({
  method: "POST",
  url   : "https://myserver.com"
});

// Emit the event
emitter.emit(myevent)
```

## Supported specification features

|                               |  [v0.3](https://github.com/cloudevents/spec/tree/v0.3) | [v1.0](https://github.com/cloudevents/spec/tree/v1.0) |
| ----------------------------- | --- | --- |
| CloudEvents Core              | :heavy_check_mark: | :heavy_check_mark: |
| AMQP Protocol Binding         | :x: | :x: |
| AVRO Event Format             | :x: | :x: |
| HTTP Protocol Binding         | :heavy_check_mark: | :heavy_check_mark: |
| JSON Event Format             | :heavy_check_mark: | :heavy_check_mark: |
| Kafka Protocol Binding        | :x: | :x: |
| NATS Protocol Binding         | :x: | :x: |
| STAN Protocol Binding         | :x: | :x: |

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
[Contributor's Guide](https://github.com/cloudevents/sdk-javascript/blob/master/CONTRIBUTING.md)
for information on how to get involved.
