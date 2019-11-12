# Docs for old spec versions

Here are living the examples of old specs implementations.

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

## The API

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
