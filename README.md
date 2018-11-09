# sdk-javascript
Javascript SDK for CloudEvents

> This is a WIP

# Repository Structure

```text
├── index.js
├── lib
│   ├── cloudevent.js
│   ├── jsonformatter.js
│   ├── format
│   │   └── json_0_1.js
│   └── specs
│       ├── spec_0_1.js
│       └── spec_0_2.js
├── LICENSE
├── package.json
├── README.md
└── test
    ├── cloudevent_spec_0_1.js
    └── cloudevent_spec_0_2.js

```

* `index.js`: library exports

* `lib/cloudevent.js`: implementation of Cloudevent, an interface

* `lib/format/`: every format implementation goes here

* `lib/format/json_0_1.js`: implementation for JSON formatting [version 0.1](https://github.com/cloudevents/spec/blob/v0.1/json-format.md)

* `lib/specs/`: every spec implementation goes here

* `lib/specs/spec_0_1.js`: implementation for spec [version 0.1](https://github.com/cloudevents/spec/blob/v0.1/spec.md)

* `lib/specs/spec_0_2.js`: implementation for spec [version 0.2](https://github.com/cloudevents/spec/blob/master/spec.md)

* `test/cloudevent_spec_0_1.js`: unit testing for spec 0.1

* `test/cloudevent_spec_0_2.js`: unit testing for spec 0.2

# Unit Testing

The unit test checks the result of formatted payload and the constraints.

```bash

npm test

```

# The API

## `Cloudevent` class

```js

/*
 * Format the payload and return an Object.
 */
Object Cloudevent.format()

/*
 * Format the payload as String.
 */
String Cloudevent.toString()

```

## `Formatter` classes

Every formatter class must implement these methods to work properly.

```js

/*
 * Format the Cloudevent payload argument and return an Object.
 */
Object Formatter.format(payload)

/*
 * Format the Cloudevent payload as String.
 */
String Formatter.toString(payload)

```

## `Spec` classes

Every Spec class must implement these methods to work properly.

```js

/*
 * Check the spec constraints, throwing an error if do not pass.
 */
Spec.check()

```

# How to use

The `Cloudevent` constructor arguments.

```js

/*
 * spec  : if is null, set the spec 0.1 impl
 * format: if is null, set the JSON Format 0.1 impl
 */
Cloudevent(spec, format);

```

## How to construct instances?

```js
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
 * Backward compatibility by injecting methods from spec implementation to Cloudevent
 */
cloudevent01
 .eventTypeVersion("1.0");

/*
 * Constructs an instance with:
 *   - Spec 0.2
 *   - JSON Format 0.1 
 */
var cloudevent02 = new Cloudevent(Cloudevent.specs['0.2']);

/*
 * Different specs, but the same API.
 */
cloudevent02
  .type("com.github.pull.create")
  .source("urn:event:from:myapi/resourse/123");

```

## How to get the formatted payload?

```js
var cloudevent = new Cloudevent()
                       .type("com.github.pull.create")
                       .source("urn:event:from:myapi/resourse/123");

/*
 * Format the payload and return it.
 */
var formatted = cloudevent.format();
 
```

> See how to implement the method injection [here](lib/specs/spec_0_1.js#L17)
>
> Learn about [Builder Design Pattern](https://en.wikipedia.org/wiki/Builder_pattern)
