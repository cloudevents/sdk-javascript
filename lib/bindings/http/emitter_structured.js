const axios = require("axios");

const Constants = require("./constants.js");
const defaults = {};
defaults[Constants.HEADERS] = {};
defaults[Constants.HEADERS][Constants.HEADER_CONTENT_TYPE] =
  Constants.DEFAULT_CE_CONTENT_TYPE;

function StructuredHTTPEmitter(configuration) {
  this.config = Object.assign({}, defaults, configuration);
}

StructuredHTTPEmitter.prototype.emit = function(cloudevent) {
  // Set the cloudevent payload
  this.config[Constants.DATA_ATTRIBUTE] = cloudevent.format();

  // Return the Promise
  return axios.request(this.config).then((response) => {
    delete this.config[Constants.DATA_ATTRIBUTE];
    return response;
  });
};

module.exports = StructuredHTTPEmitter;
