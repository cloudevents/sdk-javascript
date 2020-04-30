const {
  isString,
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("../../utils/fun.js");

function JSONParser(decorator) {
  this.decorator = decorator;
}

const invalidPayloadTypeError =
  new Error("invalid payload type, allowed are: string or object");

const nullOrIndefinedPayload =
  new Error("null or undefined payload");

// Function
const asJSON = (v) => (isString(v) ? JSON.parse(v) : v);

// Level 0 of validation: is that string? is that JSON?
function validateAndParse(payload) {
  const json =
    Array.of(payload)
      .filter((p) => isDefinedOrThrow(p, nullOrIndefinedPayload))
      .filter((p) => isStringOrObjectOrThrow(p, invalidPayloadTypeError))
      .map(asJSON)
      .shift();

  return json;
}

JSONParser.prototype.parse = function(payload) {
  let toparse = payload;

  if (this.decorator) {
    toparse = this.decorator.parse(payload);
  }

  // is that string? is that JSON?
  const valid = validateAndParse(toparse);

  return valid;
};

module.exports = JSONParser;
