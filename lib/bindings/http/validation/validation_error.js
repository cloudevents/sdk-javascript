/**
 * @typedef {import("ajv").ErrorObject} ErrorObject
 * @ignore
 * */

/**
 * A Error class that will be thrown when a CloudEvent
 * cannot be properly validated against a specification.
 */
class ValidationError extends TypeError {
  /**
   * Constructs a new {ValidationError} with the message
   * and array of additional errors.
   * @param {string} message the error message
   * @param {string[]|ErrorObject[]} [errors] any additional errors related to validation
   */
  constructor(message, errors) {
    super(message);
    this.errors = errors ? errors : [];
  }
}

module.exports = ValidationError;