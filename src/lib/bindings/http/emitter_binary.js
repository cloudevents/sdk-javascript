const { default: Axios } = require("axios");
const EmitterV1 = require("./v1").BinaryEmitter;
const EmitterV3 = require("./v03").BinaryEmitter;

const {
  HEADERS,
  BINARY_HEADERS_03,
  BINARY_HEADERS_1,
  HEADER_CONTENT_TYPE,
  DEFAULT_CONTENT_TYPE,
  DATA_ATTRIBUTE,
  SPEC_V1,
  SPEC_V03
} = require("./constants");

const defaults = {
  [HEADERS]: {
    [HEADER_CONTENT_TYPE]: DEFAULT_CONTENT_TYPE
  },
  method: "POST"
};

/**
 * A class to emit binary CloudEvents over HTTP.
 */
class BinaryHTTPEmitter {
  /**
   * Create a new {BinaryHTTPEmitter} for the provided CloudEvent specification version.
   * Once an instance is created for a given spec version, it may only be used to send
   * events for that version.
   * Default version is 1.0
   * @param {string} version - the CloudEvent HTTP specification version.
   * Default: 1.0
   */
  constructor(version) {
    if (version === SPEC_V1) {
      this.headerParserMap = EmitterV1;
      this.extensionPrefix = BINARY_HEADERS_1.EXTENSIONS_PREFIX;
    } else if (version === SPEC_V03) {
      this.headerParserMap = EmitterV3;
      this.extensionPrefix = BINARY_HEADERS_03.EXTENSIONS_PREFIX;
    }
  }

  /**
   * Sends this cloud event to a receiver over HTTP.
   *
   * @param {Object} options The configuration options for this event. Options
   * provided other than `url` will be passed along to Node.js `http.request`.
   * https://nodejs.org/api/http.html#http_http_request_options_callback
   * @param {URL} options.url The HTTP/S url that should receive this event
   * @param {Object} cloudevent the CloudEvent to be sent
   * @returns {Promise} Promise with an eventual response from the receiver
   */
  async emit(options, cloudevent) {
    const config = { ...defaults, ...options };
    const headers = config[HEADERS];

    this.headerParserMap.forEach((parser, getterName) => {
      const value = cloudevent[getterName];
      if (value) {
        headers[parser.headerName] = parser.parse(value);
      }
    });

    // Set the cloudevent payload
    const formatted = cloudevent.format();
    let data = formatted.data;
    data = (formatted.data_base64 ? formatted.data_base64 : data);

    // Have extensions?
    const exts = cloudevent.getExtensions();
    Object.keys(exts)
      .filter((ext) => Object.hasOwnProperty.call(exts, ext))
      .forEach((ext) => {
        headers[this.extensionPrefix + ext] = exts[ext];
      });

    config[DATA_ATTRIBUTE] = data;
    config[HEADERS] = headers;

    // Return the Promise
    // @ts-ignore  Types of property 'url' are incompatible. Type 'URL' is not assignable to type 'string'.
    return Axios.request(config);
  }
}

module.exports = BinaryHTTPEmitter;
