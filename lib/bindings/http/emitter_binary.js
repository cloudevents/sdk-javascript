const axios = require("axios");

const {
  HEADERS,
  BINARY_HEADERS_03,
  BINARY_HEADERS_1,
  HEADER_CONTENT_TYPE,
  DEFAULT_CONTENT_TYPE,
  DATA_ATTRIBUTE,
  SPEC_V1,
  SPEC_V03
} = require("./constants.js");

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
   *
   * @param {string} version - the CloudEvent HTTP specification version.
   * Default: 1.0
   */
  constructor(version) {
    if (version === SPEC_V1) {
      this.headerByGetter = require("./emitter_binary_1");
      this.extensionPrefix = BINARY_HEADERS_1.EXTENSIONS_PREFIX;
    } else if (version === SPEC_V03) {
      this.headerByGetter = require("./emitter_binary_0_3.js");
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
    const config = { ...options, ...defaults };
    const headers = config[HEADERS];

    Object.keys(this.headerByGetter)
      .filter((getter) => cloudevent[getter]())
      .forEach((getter) => {
        const header = this.headerByGetter[getter];
        headers[header.name] =
          header.parser(
            cloudevent[getter]()
          );
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
    config.headers = headers;

    // Return the Promise
    return axios.request(config);
  }
}

module.exports = BinaryHTTPEmitter;
