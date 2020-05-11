const BinaryHTTPEmitter = require("./emitter_binary.js");
const StructuredEmitter = require("./emitter_structured.js");

const {
  SPEC_V03,
  SPEC_V1
} = require("./constants");

/**
 * A class which is capable of sending binary and structured events using
 * the CloudEvents HTTP Protocol Binding specification.
 *
 * @see https://github.com/cloudevents/spec/blob/v1.0/http-protocol-binding.md
 * @see https://github.com/cloudevents/spec/blob/v1.0/http-protocol-binding.md#13-content-modes
 */
class HTTPEmitter {
  /**
   * Creates a new instance of {HTTPEmitter}. The default emitter uses the 1.0
   * protocol specification in binary mode.
   *
   * @param {string} [version] The HTTP binding specification version. Default: "1.0"
   * @throws {TypeError} if no options.url is provided or an unknown specification version is provided.
   */
  constructor(version = SPEC_V1) {
    if (version !== SPEC_V03 && version !== SPEC_V1) {
      throw new TypeError(
        `Unknown CloudEvent specification version: ${version}`);
    }
    this.binary = new BinaryHTTPEmitter(version);
    this.structured = new StructuredEmitter();
  }

  /**
   * Sends the {CloudEvent} to an event receiver over HTTP POST
   *
   * @param {Object} options The configuration options for this event. Options
   * provided will be passed along to Node.js `http.request()`.
   * https://nodejs.org/api/http.html#http_http_request_options_callback
   * @param {URL} options.url The HTTP/S url that should receive this event
   * @param {CloudEvent} event the CloudEvent to be sent
   * @param {string} [mode] the message mode for sending this event.
   * Possible values are "binary" and "structured". Default: structured
   * @returns {Promise} Promise with an eventual response from the receiver
   */
  send(options, event, mode = "binary") {
    if (mode === "binary") {
      this.binary.emit(options, event);
    } else if (mode === "structured") {
      this.structured.emit(options, event);
    } else {
      throw new TypeError(`Unknown transport mode ${mode}.`);
    }
  }
}

module.exports = HTTPEmitter;
