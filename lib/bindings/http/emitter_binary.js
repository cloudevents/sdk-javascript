var axios = require("axios");
var empty = require("is-empty");

const Constants = require("./constants.js");

function BinaryHTTPEmitter(config, headerByGetter, extensionPrefix){
  this.config = JSON.parse(JSON.stringify(config));
  this.headerByGetter = headerByGetter;
  this.extensionPrefix = extensionPrefix;

  this.config[Constants.HEADERS] =
    (!this.config[Constants.HEADERS]
      ? {}
      : this.config[Constants.HEADERS]);

  // default is json
  if(!this.config[Constants.HEADERS][Constants.HEADER_CONTENT_TYPE]){
    this.config[Constants.HEADERS][Constants.HEADER_CONTENT_TYPE] =
      Constants.DEFAULT_CONTENT_TYPE;
  }
}

BinaryHTTPEmitter.prototype.emit = function(cloudevent) {
  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Always set stuff in _config
  var _headers = _config[Constants.HEADERS];

  Object.keys(this.headerByGetter)
    .filter((getter) => cloudevent[getter]())
    .forEach((getter) => {
      let header = this.headerByGetter[getter];
      _headers[header.name] =
        header.parser(
          cloudevent[getter]()
        );
    });

  // Set the cloudevent payload
  let formatted = cloudevent.format();
  let data = formatted.data;
  data = (formatted.data_base64 ? formatted.data_base64: data);

  _config[Constants.DATA_ATTRIBUTE] = data;

  // Have extensions?
  var exts = cloudevent.getExtensions();
  Object.keys(exts)
    .filter((ext) => Object.hasOwnProperty.call(exts, ext))
    .forEach((ext) => {
      _headers[this.extensionPrefix + ext] = exts[ext];
    });

  // Return the Promise
  return axios.request(_config);
};

module.exports = BinaryHTTPEmitter;
