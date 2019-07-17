function JSONParser() {

}

const invalidPayloadTypeError =
  new Error("invalid payload type, allowed are: string or object");

const nullOrIndefinedPayload =
  new Error("null or undefined payload");

// Functions
const isString = (v) => (typeof v) === "string";
const isObject = (v) => (typeof v) === "object";
const isDefined = (v) => v && (typeof v) != "undefined";
const isDefinedOrThrow = (v) =>
  (isDefined(v) ? () => true
    : (() => {throw nullOrIndefinedPayload})());

const isValidPayloadOrThrow = (v) =>
  isDefinedOrThrow(v)()
    && (isString(v)
          ? true
          : isObject(v)
            ? true
            : (() => {throw invalidPayloadTypeError})());

const asJSON = (v) => (isString(v) ? JSON.parse(v) : v);

/**
 * Level 0 of validation: is that string? is that JSON?
 */
function validateAndParse(payload) {

  var json =
    Array.of(payload)
      .filter(isValidPayloadOrThrow)
      .map(asJSON)
      .shift();

  return json;
}

/*
 * Level 1 of validation: is that follow a spec?
 */
function validateSpec(payload, spec) {

  // is that follow the spec?
  spec.check(payload);

  return payload;
}

JSONParser.prototype.parse = function(payload) {

  //is that string? is that JSON?
  var valid = validateAndParse(payload);

  return valid;
}

module.exports = JSONParser;
