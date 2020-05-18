const ReceiverV1 = require("./v1/receiver_binary_1.js");
const ReceiverV3 = require("./v03/receiver_binary_0_3.js");

const { SPEC_V03, SPEC_V1 } = require("./constants.js");
const { check, parse } = require("./validation/binary.js");

/**
 * A class that receives binary CloudEvents over HTTP. This class can be used
 * if you know that all incoming events will be using binary transport. If
 * events can come as either binary or structured, use {HTTPReceiver}.
 */
class BinaryHTTPReceiver {
  /**
   * Creates a new BinaryHTTPReceiver to accept events over HTTP.
   *
   * @param {string} version the Cloud Event specification version to use. Default "1.0"
   */
  constructor(version = SPEC_V1) {
    if (version === SPEC_V1) {
      this.receiver = new ReceiverV1();
    } else if (version === SPEC_V03) {
      this.receiver = new ReceiverV3();
    }
  }

  /**
   * Checks an incoming HTTP request to determine if it conforms to the
   * Cloud Event specification for this receiver.
   *
   * @param {Object} payload the HTTP request body
   * @param {Object} headers  the HTTP request headers
   * @returns {boolean} true if the the provided payload and headers conform to the spec
   * @throws {ValidationError} if the event does not conform to the spec
   */
  check(payload, headers) {
    return check(payload, headers, this.receiver);
  }

  /**
   * Parses an incoming HTTP request, converting it to a {CloudEvent}
   * instance if it conforms to the Cloud Event specification for this receiver.
   *
   * @param {Object} payload the HTTP request body
   * @param {Object} headers the HTTP request headers
   * @returns {CloudEvent} an instance of CloudEvent representing the incoming request
   * @throws {ValidationError} of the event does not conform to the spec
   */
  parse(payload, headers) {
    return parse(payload, headers, this.receiver);
  }
}

module.exports = BinaryHTTPReceiver;
