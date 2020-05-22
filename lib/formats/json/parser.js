const {
  isString,
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("../../bindings/http/validation/fun.js");
const ValidationError = require("../../bindings/http/validation/validation_error.js");

const invalidPayloadTypeError = new ValidationError("invalid payload type, allowed are: string or object");
const nullOrUndefinedPayload = new ValidationError("null or undefined payload");

const asJSON = (v) => (isString(v) ? JSON.parse(v) : v);

class JSONParser {
  constructor(decorator) {
    this.decorator = decorator;
  }

  /**
   * Parses the payload with an optional decorator
   * @param {object|string} payload the JSON payload
   * @return {object} the parsed JSON payload.
   */
  parse(payload) {
    if (this.decorator) {
      payload = this.decorator.parse(payload);
    }

    isDefinedOrThrow(payload, nullOrUndefinedPayload);
    isStringOrObjectOrThrow(payload, invalidPayloadTypeError);
    return asJSON(payload);
  }
}

module.exports = JSONParser;
