# sdk-javascript
Javascript SDK for CloudEvents

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

# How to use

```js

/* 
 * Constructs a default instance with:
 *   - Spec 0.1
 *   - JSON Format 0.1
 */
var cloudevent01 = new Cloudevent();

/*
 * Constructs an instance with:
 *   - Spec 0.2
 *   - JSON Format 0.1 
 */
var cloudevent02 = new Cloudevent(Cloudevent.specs['0.2']);

```
