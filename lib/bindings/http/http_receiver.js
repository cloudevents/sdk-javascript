// const V03Binary = require("./receiver_binary_0_3.js");
// const V03Structured = require("./v03/receiver_structured_0_3.js");
// const V1Binary = require("./receiver_binary_1.js");
// const V1Structured = require("./v1/receiver_structured_1.js");
const BinaryReceiver = require("./receiver_binary.js");
const StructuredReceiver = require("./receiver_structured.js");
const ValidationError = require("./validation/validation_error.js");
const {
  BINARY,
  STRUCTURED,
  SPEC_V03,
  SPEC_V1,
  HEADER_CONTENT_TYPE,
  MIME_CE,
  BINARY_HEADERS_1,
  DEFAULT_SPEC_VERSION_HEADER
} = require("./constants");

/** @typedef {import("../../cloudevent")} CloudEvent */

/**
 * A class to receive a CloudEvent from an HTTP POST request.
 */
class HTTPReceiver {
  /**
   * Create an instance of an HTTPReceiver to accept incoming CloudEvents.
   */
  constructor() {
    this.receivers = {
      v1: {
        structured: new StructuredReceiver(SPEC_V1),
        binary: new BinaryReceiver(SPEC_V1)
      },
      v03: {
        structured: new StructuredReceiver(SPEC_V03),
        binary: new BinaryReceiver(SPEC_V03)
      }
    };
  }

  /**
   * Acceptor for an incoming HTTP CloudEvent POST. Can process
   * binary and structured incoming CloudEvents.
   *
   * @param {Object} headers HTTP headers keyed by header name ("Content-Type")
   * @param {Object|JSON} body The body of the HTTP request
   * @return {CloudEvent} A new {CloudEvent} instance
   */
  accept(headers, body) {
    const mode = getMode(headers);
    const version = getVersion(mode, headers, body);
    switch (version) {
      case SPEC_V1:
        return this.receivers.v1[mode].parse(body, headers);
      case SPEC_V03:
        return this.receivers.v03[mode].parse(body, headers);
      default:
        console.error(
          `Unknown spec version ${version}. Default to ${SPEC_V1}`);
        return this.receivers.v1[mode].parse(body, headers);
    }
  }
}

function getMode(headers) {
  const contentType = headers[HEADER_CONTENT_TYPE];
  if (contentType && contentType.startsWith(MIME_CE)) {
    return STRUCTURED;
  }
  if (headers[BINARY_HEADERS_1.ID]) {
    return BINARY;
  }
  throw new ValidationError("no cloud event detected");
}

function getVersion(mode, headers, body) {
  if (mode === BINARY) {
    // Check the headers for the version
    const versionHeader = headers[DEFAULT_SPEC_VERSION_HEADER];
    if (versionHeader) {
      return versionHeader;
    }
  } else {
    // structured mode - the version is in the body
    return (typeof body === "string")
      ? JSON.parse(body).specversion : body.specversion;
  }
  return SPEC_V1;
}

module.exports = HTTPReceiver;
