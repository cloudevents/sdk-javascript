const ReceiverV1 = require("./v1/receiver_structured_1.js");
const ReceiverV3 = require("./v03/receiver_structured_0_3.js");

const { SPEC_V03, SPEC_V1 } = require("./constants.js");
const { check, parse } = require("./validation/structured.js");

/** @typedef {import("../../cloudevent")} CloudEvent */

/**
 * A utility class used to receive structured CloudEvents
 * over HTTP.
 * @see {StructuredReceiver}
 */
class StructuredHTTPReceiver {
  /**
   * Creates a new StructuredHTTPReceiver. Supports Cloud Events specification
   * versions 0.3 and 1.0 (default).
   *
   * @param {string} version the Cloud Events specification version. Default: 1.0.
   */
  constructor(version = SPEC_V1) {
    if (version === SPEC_V1) {
      this.receiver = new ReceiverV1();
    } else if (version === SPEC_V03) {
      this.receiver = new ReceiverV3();
    }
  }

  /**
   * Checks whether the provided payload and headers conform to the Cloud Events
   * specification version supported by this instance.
   *
   * @param {object} payload the cloud event data payload
   * @param {object} headers the HTTP headers received for this cloud event
   * @returns {boolean} true if the payload and header combination are valid
   * @throws {ValidationError} if the payload and header combination do not conform to the spec
   */
  check(payload, headers) {
    return check(payload, headers, this.receiver);
  }

  /**
   * Creates a new CloudEvent instance based on the provided payload and headers.
   *
   * @param {object} payload the cloud event data payload
   * @param {object} headers  the HTTP headers received for this cloud event
   * @returns {CloudEvent} a new CloudEvent instance for the provided headers and payload
   * @throws {ValidationError} if the payload and header combination do not conform to the spec
   */
  parse(payload, headers) {
    return parse(payload, headers, this.receiver);
  }
}

module.exports = StructuredHTTPReceiver;
