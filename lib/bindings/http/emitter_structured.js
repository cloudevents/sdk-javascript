var axios = require("axios");

const Constants = require("./constants.js");

function StructuredHTTPEmitter(configuration){
  this.config = JSON.parse(JSON.stringify(configuration));

  this.config[Constants.HEADERS] =
    (!this.config[Constants.HEADERS]
      ? {}
      : this.config[Constants.HEADERS]);

  if(!this.config[Constants.HEADERS][Constants.HEADER_CONTENT_TYPE]){
    this.config[Constants.HEADERS][Constants.HEADER_CONTENT_TYPE] =
      Constants.DEFAULT_CE_CONTENT_TYPE;
  }
}

StructuredHTTPEmitter.prototype.emit = function(cloudevent) {
  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Set the cloudevent payload
  _config[Constants.DATA_ATTRIBUTE] = cloudevent.format();

  // Return the Promise
  return axios.request(_config);
};

module.exports = StructuredHTTPEmitter;
