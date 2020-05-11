const axios = require("axios");
const {
  DATA_ATTRIBUTE,
  DEFAULT_CE_CONTENT_TYPE,
  HEADERS,
  HEADER_CONTENT_TYPE
} = require("./constants.js");

const defaults = {
  [HEADERS]: {
    [HEADER_CONTENT_TYPE]: DEFAULT_CE_CONTENT_TYPE
  },
  method: "POST"
};

/**
 * A class for sending {CloudEvent} instances over HTTP.
 */
class StructuredHTTPEmitter {
  // TODO: Do we really need a class here? There is no state maintenance

  /**
   * Sends the event over HTTP
   * @param {Object} options The configuration options for this event. Options
   * provided will be passed along to Node.js `http.request()`.
   * https://nodejs.org/api/http.html#http_http_request_options_callback
   * @param {URL} options.url The HTTP/S url that should receive this event
   * @param {CloudEvent} cloudevent The CloudEvent to be sent
   * @returns {Promise} Promise with an eventual response from the receiver
   */
  async emit(options, cloudevent) {
    const config = { ...defaults, ...options };
    config[DATA_ATTRIBUTE] = cloudevent.format();
    return axios.request(config);
  }
}

module.exports = StructuredHTTPEmitter;
