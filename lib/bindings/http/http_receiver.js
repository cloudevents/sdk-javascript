const V03Binary = require("./receiver_binary_0_3");
const V03Structured = require("./receiver_structured_0_3.js");
const V1Binary = require("./receiver_binary_1.js");
const V1Structured = require("./receiver_structured_1.js");
const constants = require("./constants");

class HTTPReceiver {
  constructor() {
    this.receivers = {
      v1: {
        structured: new V1Structured(),
        binary: new V1Binary()
      },
      v03: {
        structured: new V03Structured(),
        binary: new V03Binary()
      }
    };
  }

  accept(headers, body) {
    const mode = getMode(headers);
    const version = getVersion(mode, headers, body);
    switch (version) {
      case constants.SPEC_V1:
        return this.receivers.v1[mode].parse(body, headers);
      case constants.SPEC_V03:
        return this.receivers.v03[mode].parse(body, headers);
      default:
        console.error(
          `Unknown spec version ${version}. Default to ${constants.SPEC_V1}`);
        return this.receivers.v1[mode].parse(body, headers);
    }
  }
}

function getMode(headers) {
  let mode = "binary";
  const contentType = headers[constants.HEADER_CONTENT_TYPE];
  if (contentType && contentType.startsWith(constants.MIME_CE)) {
    mode = "structured";
  }
  return mode;
}

function getVersion(mode, headers, body) {
  let version = constants.SPEC_V1; // default to 1.0

  if (mode === "binary") {
    // Check the headers for the version
    const versionHeader = headers[constants.DEFAULT_SPEC_VERSION_HEADER];
    if (versionHeader) { version = versionHeader; }
  } else {
    // structured mode - the version is in the body
    version = body instanceof String
      ? JSON.parse(body).specversion : body.specversion;
  }
  return version;
}

module.exports = HTTPReceiver;
