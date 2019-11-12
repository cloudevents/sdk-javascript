[![licence](https://img.shields.io/github/license/cloudevents/sdk-javascript)](http://www.apache.org/licenses/LICENSE-2.0)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/bd66e7c52002481993cd6d610534b0f7)](https://www.codacy.com/app/fabiojose/sdk-javascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=cloudevents/sdk-javascript&amp;utm_campaign=Badge_Coverage)
[![Build Status](https://travis-ci.org/cloudevents/sdk-javascript.svg?branch=master)](https://travis-ci.org/cloudevents/sdk-javascript)
[![downloads](https://img.shields.io/npm/dy/cloudevents-sdk.svg)](https://www.npmjs.com/package/cloudevents-sdk)
[![npm version](https://img.shields.io/npm/v/cloudevents-sdk.svg)](https://www.npmjs.com/package/cloudevents-sdk)
[![dependencies](https://david-dm.org/cloudevents/sdk-javascript.svg)](https://david-dm.org/cloudevents/sdk-javascript)
[![vulnerabilities](https://snyk.io/test/github/cloudevents/sdk-javascript/badge.svg)](https://snyk.io/test/github/cloudevents/sdk-javascript)

# sdk-javascript

Official CloudEvents' SDK for JavaScript.

<img src="https://github.com/cncf/artwork/blob/master/projects/cloudevents/horizontal/color/cloudevents-horizontal-color.png" width="300" height="58" alt="CloudEvents logo">

**NOTE: This SDK is still considered work in progress, things might (and will)
break with every update.**

**Checkout the [changelog](./CHANGELOG.md) to see what's going on!**

## Contributing

Before create an awesome PR, please read our [guidelines](./CONTRIBUTING.md).

## Examples

To see working examples, point to [examples](./examples).

## :newspaper: Newsletter :newspaper:

> all the API developed before, for 0.1, 0.2 and 0.3, works as the same.

Checkout the new expressive additions.

### Use typed CloudEvents in your Typescript project

> There is full example: [typescript-ex](./examples/typescript-ex)

```ts
import Cloudevent, {
  event,
  StructuredHTTPEmitter,
  BinaryHTTPEmitter,

  StructuredHTTPReceiver,
  BinaryHTTPReceiver
} from 'cloudevents-sdk/v1';

let myevent: Cloudevent = event()
  .source('/source')
  .type('type')
  .dataContentType('text/plain')
  .dataschema('http://d.schema.com/my.json')
  .subject('cha.json')
  .data('my-data')
  .addExtension("my-ext", "0x600");

// . . .

```

## Versioning

### Before Spec reaches 1.0

- `0.x.p`: where `x` relates to spec version and `p` relates to fixes, releases
and breaking changes

### After Spec reaches 1.0

- `x.M.p`: where `x` relates to spec version, `M` relates to minor and `p` relates
to fixes. See [semver](https://semver.org/)

## Installation

This CloudEvents SDK requires nodejs 6.11+

### Nodejs

```sh
npm install cloudevents-sdk
```
## Specification Support

These are the supported specifications by this version.

| **Specifications**                    | v0.1 | v0.2 | v0.3 | **v1.0** |
|---------------------------------------|------|------|------|----------|
| CloudEvents                           | yes  | yes  | yes  |   yes    |
| HTTP Transport Binding  - Structured  | yes  | yes  | yes  |   yes    |
| HTTP Transport Binding  - Binary      | yes  | yes  | yes  |   yes    |
| JSON Event Format                     | yes  | yes  | yes  |   yes    |

### What we can do

| **What**                            | v0.1   | v0.2 | v0.3 | **v1.0** |
|-------------------------------------|--------|------|------|----------|
| Create events                       | yes    | yes  | yes  |   yes    |
| Emit Structured events over HTTP    | yes    | yes  | yes  |   yes    |
| Emit Binary events over HTTP        | yes    | yes  | yes  |   yes    |
| JSON Event Format                   | yes    | yes  | yes  |   yes    |
| Receive Structured events over HTTP | **no** | yes  | yes  |   yes    |
| Receive Binary events over HTTP     | **no** | yes  | yes  |   yes    |

## How to use

> If you want old examples, they are [here](./OLDOCS.md)

### Usage

```js
const v1 = require("cloudevents-sdk/v1");

/*
 * Creating an event
 */
let myevent = v1.event()
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resourse/123");
```

#### Formatting

```js
const v1 = require("cloudevents-sdk/v1");

/*
 * Creating an event
 */
let myevent = v1.event()
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resourse/123");

/*
 * Format the payload and return it
 */
let formatted = myevent.format();
```

#### Emitting

```js
const v1 = require("cloudevents-sdk/v1");

/*
 * Creating an event
 */
let myevent = v1.event()
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resourse/123");

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

const v1 = require("cloudevents-sdk/v1");

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

## Repository Structure

```text
├── index.js
├── ext
├── lib
│   ├── bindings
│   │   └── http
│   ├── cloudevent.js
│   ├── formats
│   │   └── json
│   └── specs
├── LICENSE
├── package.json
├── README.md
```

- `index.js`: library exports
- `ext`: external stuff, e.g, Cloud Events JSONSchema
- `lib/bindings`: every binding implementation goes here
- `lib/bindings/http`: every http binding implementation goes here
- `lib/cloudevent.js`: implementation of Cloudevent, an interface
- `lib/formats/`: every format implementation goes here
- `lib/specs/`: every spec implementation goes here

## Unit Testing

The unit test checks the result of formatted payload and the constraints.

```bash
npm test
```

## The API

### `Cloudevent` class

```js
/*
 * Format the payload and return an Object.
 */
Object Cloudevent.format()

/*
 * Format the payload as String.
 */
String Cloudevent.toString()

/*
 * Create a Cloudevent instance from String.
 */
Cloudevent Cloudevent.fromString(String)

```

### `Formatter` classes

Every formatter class must implement these methods to work properly.

```js
/*
 * Format the Cloudevent payload argument and return an Object.
 */
Object Formatter.format(Object)

/*
 * Format the Cloudevent payload as String.
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
 * The constructor must receives the Cloudevent type.
 */
Spec(Cloudevent)

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

Following we have the signature for the binding to emit Cloudevents.

```js
/*
 * The constructor must receives the map of configurations.
 */
Binding(config)

/*
 * Emits the event using an instance of Cloudevent.
 */
Binding.emit(cloudevent)
```

#### Receiver Binding

Following we have the signature for the binding to receive Cloudevents.

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
 * Checks and parse as Cloudevent
 */
Cloudevent Receiver.parse(Object, Map)
```

> See how to implement the method injection [here](lib/specs/spec_0_1.js#L17)
>
> Learn about [Builder Design Pattern](https://en.wikipedia.org/wiki/Builder_pattern)
>
> Check out the produced event payload using this [tool](https://webhook.site)
