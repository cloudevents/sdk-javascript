const {
  isString,
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("../../bindings/http/validation/fun");
const ValidationError = require("../../bindings/http/validation/validation_error.js");

const invalidPayloadTypeError = new ValidationError("invalid payload type, allowed are: string or object");
const nullOrUndefinedPayload = new ValidationError("null or undefined payload");

const asJSON = (v: object|string) => (isString(v) ? JSON.parse(v as string) : v);

class JSONParser {
  decorator: Base64Parser
  constructor(decorator: Base64Parser) {
    this.decorator = decorator;
  }

  /**
   * Parses the payload with an optional decorator
   * @param {object|string} payload the JSON payload
   * @return {object} the parsed JSON payload.
   */
  parse(payload: object|string) {
    if (this.decorator) {
      payload = this.decorator.parse(payload);
    }

    isDefinedOrThrow(payload, nullOrUndefinedPayload);
    isStringOrObjectOrThrow(payload, invalidPayloadTypeError);
    return asJSON(payload);
  }
}

module.exports = JSONParser;
