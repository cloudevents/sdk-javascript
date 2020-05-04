const V03Binary = require("./receiver_binary_0_3");
const V03Structured = require("./receiver_structured_0_3.js");
const V1Binary = require("./receiver_binary_1.js");
const V1Structured = require("./receiver_structured_1.js");

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
      case "1.0":
        return this.receivers.v1[mode].parse(body, headers);
      case "0.3":
        return this.receivers.v03[mode].parse(body, headers);
      default:
        console.error(`Unknown spec version ${version}, defaulting to 1.0`);
        return this.receivers.v1[mode].parse(body, headers);
    }
  }
}

function getMode(headers) {
  let mode = "binary";
  if (headers["Content-Type"]) {
    if (headers["Content-Type"].startsWith("application/cloudevents+")) {
      mode = "structured";
    }
  }
  return mode;
}

function getVersion(mode, headers, body) {
  let version = "1.0"; // default to 1.0

  if (mode === "binary") {
    // Check the headers for the version
    if (headers["ce-specversion"]) {
      version = headers["ce-specversion"];
    }
  } else {
    // structured mode - the version is in the body
    version = body instanceof String
      ? JSON.parse(body).specversion : body.specversion;
  }
  return version;
}

module.exports = HTTPReceiver;
