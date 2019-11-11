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

> all the API developed before, for 0.1 and 0.2, works as the same.

Checkout the new expressive additions.

### New way to import the specifications stuff

```js
// Import the v0.3 stuff
const v03 = require("cloudevents-sdk/v03");

// Access the spec
v03.Spec;

// Access the structured http event emitter
v03.StructuredHTTPEmitter;

// Access the binary http event emitter
v03.BinaryHTTPEmitter;

// Access http unmarshaller to process incoming events, Binary or Structured
v03.HTTPUnmarshaller;
```

### An easy way to create events

```js
// Import the v0.3 stuff
const v03 = require("cloudevents-sdk/v03");

// Creates an event using the v0.3 spec
let ce =
  v03.event()
       .type("com.github.pull.create")
       .source("urn:event:from:myapi/resourse/123");
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

| **Specifications**                    | **v0.1** | **v0.2** | **v0.3** |
|---------------------------------------|----------|----------|----------|
| CloudEvents                           | yes      | yes      | yes      |
| HTTP Transport Binding  - Structured  | yes      | yes      | yes      |
| HTTP Transport Binding  - Binary      | yes      | yes      | yes      |
| JSON Event Format                     | yes      | yes      | yes      |

### What we can do

| **What**                            | **v0.1** | **v0.2** | **v0.3** |
|-------------------------------------|----------|----------|----------|
| Create events                       | yes      | yes      | yes      |
| Emit Structured events over HTTP    | yes      | yes      | yes      |
| Emit Binary events over HTTP        | yes      | yes      | yes      |
| JSON Event Format                   | yes      | yes      | yes      |
| Receive Structured events over HTTP | no       | yes      | yes      |
| Receive Binary events over HTTP     | no       | yes      | yes      |

## How to use

The `Cloudevent` constructor arguments.

```js
/*
 * spec  : if is null, set the spec 0.1 impl
 * format: if is null, set the JSON Format 0.1 impl
 */
Cloudevent(spec, format);

```

### Usage

```js
var Cloudevent = require("cloudevents-sdk");

var Spec02 = require("cloudevents-sdk/v02");

/*
 * Constructs a default instance with:
 *   - Spec 0.1
 *   - JSON Format 0.1
 */
var cloudevent01 = new Cloudevent();

/*
 * Implemented using Builder Design Pattern
 */
cloudevent01
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resourse/123");

/*
 * Backward compatibility to spec 0.1 by injecting methods from spec
 * implementation to Cloudevent
 */
cloudevent01
  .eventTypeVersion("1.0");

/*
 * Constructs an instance with:
 *   - Spec 0.2
 *   - JSON Format 0.1
 */
var cloudevent02 = new Cloudevent(Cloudevent.specs["0.2"]);

/*
 * Different specs, but the same API.
 */
cloudevent02
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resourse/123");

```

#### Formatting

```js
var Cloudevent = require("cloudevents-sdk");

/*
 * Creates an instance with default spec and format
 */
var cloudevent =
  new Cloudevent()
        .type("com.github.pull.create")
        .source("urn:event:from:myapi/resourse/123");

/*
 * Format the payload and return it
 */
var formatted = cloudevent.format();
```

#### Emitting

```js
var Cloudevent = require("cloudevents-sdk");

// The event
var cloudevent =
  new Cloudevent()
    .type("com.github.pull.create")
    .source("urn:event:from:myapi/resourse/123");

// The binding configuration using POST
var config = {
  method: "POST",
  url   : "https://myserver.com"
};

/*
 * To use HTTP Binary:
 *   Cloudevent.bindings["http-binary0.2"](config);
 */

// The binding instance
var binding = new Cloudevent.bindings["http-structured0.1"](config);

// Emit the event using Promise
binding.emit(cloudevent)
  .then(response => {
    // Treat the response
    console.log(response.data);

  }).catch(err => {
    // Deal with errors
    console.error(err);
  });
```
#### Receiving Events

You can choose any framework for port binding. But, use the Unmarshaller
to process the HTTP Payload and HTTP Headers, extracting the CloudEvents.

The Unmarshaller will parse the HTTP Request and decides if it is a binary
or a structured version of transport binding.

:smiley: **Checkout the full working example: [here](./examples/express-ex).**

```js
// some parts were removed //

const v02 = require("cloudevents-sdk/v02");
const unmarshaller = new v02.HTTPUnmarshaller();

// some parts were removed //

app.post('/', function (req, res) {
  unmarshaller.unmarshall(req.body, req.headers)
    .then(cloudevent => {

      // TODO use the cloudevent

      res.status(201)
            .send("Event Accepted");
  })
  .catch(err => {
    console.error(err);
    res.status(415)
          .header("Content-Type", "application/json")
          .send(JSON.stringify(err));
  });
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

### `Unmarshaller` classes

The Unmarshaller classes uses the receiver API, abstracting the formats:

- structured
- binary

Choosing the right implementation based on the `headers` map.

```js
/*
 * Constructor without arguments
 */
Unmarshaller()

/*
 * The method to unmarshall the payload.
 * @arg payload could be a string or a object
 * @arg headers a map of headers
 */
Promise Unmarshaller.unmarshall(payload, headers)
```

> See how to implement the method injection [here](lib/specs/spec_0_1.js#L17)
>
> Learn about [Builder Design Pattern](https://en.wikipedia.org/wiki/Builder_pattern)
>
> Check out the produced event payload using this [tool](https://webhook.site)
