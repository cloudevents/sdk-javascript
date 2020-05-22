const BinaryHTTPEmitter = require("./emitter_binary.js");
const StructuredEmitter = require("./emitter_structured.js");
const EmitterV1 = require("./v1").BinaryEmitter;
const EmitterV03 = require("./v03").BinaryEmitter;

/** @typedef {import("../../cloudevent")} CloudEvent */

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
   * @param {Object} [options] The configuration options for this event emitter
   * @param {URL} options.url The endpoint that will receive the sent events.
   * @param {string} [options.version] The HTTP binding specification version. Default: "1.0"
   * @throws {TypeError} if no options.url is provided or an unknown specification version is provided.
   */
  constructor({ url, version = SPEC_V1 } = { url: undefined }) {
    if (version !== SPEC_V03 && version !== SPEC_V1) {
      throw new TypeError(
        `Unknown CloudEvent specification version: ${version}`);
    }
    if (!url) {
      throw new TypeError("A default endpoint URL is required for a CloudEvent emitter");
    }
    this.binary = new BinaryHTTPEmitter(version);
    this.structured = new StructuredEmitter();
    this.url = url;
  }

  /**
   * Sends the {CloudEvent} to an event receiver over HTTP POST
   *
   * @param {CloudEvent} event the CloudEvent to be sent
   * @param {Object} [options] The configuration options for this event. Options
   * provided will be passed along to Node.js `http.request()`.
   * https://nodejs.org/api/http.html#http_http_request_options_callback
   * @param {URL} [options.url] The HTTP/S url that should receive this event.
   * The URL is optional if one was provided when this emitter was constructed.
   * In that case, it will be used as the recipient endpoint. The endpoint can
   * be overridden by providing a URL here.
   * @param {string} [options.mode] the message mode for sending this event.
   * Possible values are "binary" and "structured". Default: structured
   * @returns {Promise} Promise with an eventual response from the receiver
   */
  send(event, { url, mode = "binary", ...httpOpts } = { url: undefined }) {
    if (!url) { url = this.url; }
    // @ts-ignore Property 'url' does not exist on type '{}'
    httpOpts.url = url;
    if (mode === "binary") {
      // @ts-ignore Property 'url' is missing in type '{}' but required in type '{ url: URL; }'.
      return this.binary.emit(httpOpts, event);
    } else if (mode === "structured") {
      // @ts-ignore Property 'url' is missing in type '{}' but required in type '{ url: URL; }'.
      return this.structured.emit(httpOpts, event);
    }
    throw new TypeError(`Unknown transport mode ${mode}.`);
  }
}

/**
 * Returns the HTTP headers that will be sent for this event when the HTTP transmission
 * mode is "binary". Events sent over HTTP in structured mode only have a single CE header
 * and that is "ce-id", corresponding to the event ID.
 * @param {CloudEvent} event a CloudEvent
 * @param {string} [version] spec version number - default 1.0
 * @returns {Object} the headers that will be sent for the event
 */
function headers(event, version = SPEC_V1) {
  const headers = {};
  let headerMap;
  if (version === SPEC_V1) {
    headerMap = EmitterV1;
  } else if (version === SPEC_V03) {
    headerMap = EmitterV03;
  }
  headerMap.forEach((parser, getterName) => {
    const value = event[getterName];
    if (value) {
      headers[parser.headerName] = parser.parse(value);
    }
  });

  return headers;
}

HTTPEmitter.headers = headers;
module.exports = HTTPEmitter;
