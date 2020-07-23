# JavaScript SDK for CloudEvents

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Coverage)
[![Build Status](https://travis-ci.org/cloudevents/sdk-javascript.svg?branch=master)](https://travis-ci.org/cloudevents/sdk-javascript)
[![downloads](https://img.shields.io/npm/dy/cloudevents-sdk.svg)](https://www.npmjs.com/package/cloudevents-sdk)
[![npm version](https://img.shields.io/npm/v/cloudevents-sdk.svg)](https://www.npmjs.com/package/cloudevents-sdk)
[![vulnerabilities](https://snyk.io/test/github/cloudevents/sdk-javascript/badge.svg)](https://snyk.io/test/github/cloudevents/sdk-javascript)
[![licence](https://img.shields.io/github/license/cloudevents/sdk-javascript)](http://www.apache.org/licenses/LICENSE-2.0)


The CloudEvents SDK for JavaScript.

## Status

This SDK is still considered a work in progress.

This SDK current supports the following versions of CloudEvents:

- v1.0

**Checkout the [changelog](CHANGELOG.md) to see what's going on!**

## Installation

This CloudEvents SDK requires nodejs 6.11+

### Nodejs

```sh
npm install cloudevents
```
## Specification Support

These are the supported specifications by this version.

| **Specifications**                    | v0.3 | **v1.0** |
|---------------------------------------|------|----------|
| CloudEvents                           | yes  |   yes    |
| HTTP Transport Binding  - Structured  | yes  |   yes    |
| HTTP Transport Binding  - Binary      | yes  |   yes    |
| JSON Event Format                     | yes  |   yes    |

### What we can do

| **What**                            | v0.3 | **v1.0** |
|-------------------------------------|------|----------|
| Create events                       | yes  |   yes    |
| Emit Structured events over HTTP    | yes  |   yes    |
| Emit Binary events over HTTP        | yes  |   yes    |
| JSON Event Format                   | yes  |   yes    |
| Receive Structured events over HTTP | yes  |   yes    |
| Receive Binary events over HTTP     | yes  |   yes    |

## How to use

### Usage

```js
const v1 = require("cloudevents/v1");

/*
 * Creating an event
 */
let myevent = v1.event()
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resource/123");
```

#### Formatting

```js
const v1 = require("cloudevents/v1");

/*
 * Creating an event
 */
let myevent = v1.event()
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resource/123");

/*
 * Format the payload and return it
 */
let formatted = myevent.format();
```

#### Emitting

```js
const v1 = require("cloudevents/v1");

/*
 * Creating an event
 */
let myevent = v1.event()
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resource/123");

// The binding configuration using POST
let config = {
  method: "POST",
  url   : "https://myserver.com"
};

// The binding instance
let binding = new v1.StructuredHTTPEmitter(config);

// Emit the event using Promise
binding.emit(myevent)
  .then(response => {
    // Treat the response
    console.log(response.data);

  }).catch(err => {
    // Deal with errors
    console.error(err);
  });
```

#### Receiving Events

You can choose any framework for port binding. But, use the
StructuredHTTPReceiver or BinaryHTTPReceiver to process the HTTP Payload and
HTTP Headers, extracting the CloudEvents.

:smiley: **Checkout the full working example: [here](./examples/express-ex).**

```js
// some parts were removed //

const v1 = require("cloudevents/v1");

const receiver = new v1.StructuredHTTPReceiver();

// some parts were removed //

app.post("/", (req, res) => {
  try {
    let myevent = receiver.parse(req.body, req.headers);

    // TODO use the event

    res.status(201).send("Event Accepted");

  } catch(err) {
    // TODO deal with errors
    console.error(err);
    res.status(415)
          .header("Content-Type", "application/json")
          .send(JSON.stringify(err));
  }
});
```

## Unit Testing

The unit test checks the result of formatted payload and the constraints.

```bash
npm test
```

## The API

### `CloudEvent` class

```js
/*
 * Format the payload and return an Object.
 */
Object CloudEvent.format()

/*
 * Format the payload as String.
 */
String CloudEvent.toString()
```

### `Formatter` classes

Every formatter class must implement these methods to work properly.

```js
/*
 * Format the CloudEvent payload argument and return an Object.
 */
Object Formatter.format(Object)

/*
 * Format the CloudEvent payload as String.
 */
String Formatter.toString(Object)
```

### `Parser` classes

Every Parser class must implement these methods to work properly.

```js
/*
 * The default constructor with Parser as decorator
 */
Parser(Parser)

/*
 * Try to parse the payload to some event format
 */
Object Parser.parse(payload)
```

### `Spec` classes

Every Spec class must implement these methods to work properly.

```js
/*
 * The constructor must receives the CloudEvent type.
 */
Spec(CloudEvent)

/*
 * Checks the spec constraints, throwing an error if do not pass.
 * @throws Error when it is an invalid event
 */
Spec.check()

/*
 * Checks if the argument pass through the spec constraints
 * @throws Error when it is an invalid event
 */
Spec.check(Object)
```

### `Binding` classes

Every Binding class must implement these methods to work properly.

#### Emitter Binding

Following we have the signature for the binding to emit CloudEvents.

```js
/*
 * The constructor must receives the map of configurations.
 */
Binding(config)

/*
 * Emits the event using an instance of CloudEvent.
 */
Binding.emit(cloudEvent)
```

#### Receiver Binding

Following we have the signature for the binding to receive CloudEvents.

```js
/*
 * The constructor must receives the map of configurations.
 */
Receiver(config)

/*
 * Checks if some Object and a Map of headers
 * follows the binding definition, throwing an error if did not follow
 */
Receiver.check(Object, Map)

/*
 * Checks and parse as CloudEvent
 */
CloudEvent Receiver.parse(Object, Map)
```

## Versioning

- `x.M.p`: where `x` relates to spec version, `M` relates to minor and `p` relates
to fixes. See [semver](https://semver.org/)

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
