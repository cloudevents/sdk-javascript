const axios = require("axios");

const Constants = require("./constants.js");
const defaults = {};
defaults[Constants.HEADERS] = {};
defaults[Constants.HEADERS][Constants.HEADER_CONTENT_TYPE] =
  Constants.DEFAULT_CONTENT_TYPE;

function BinaryHTTPEmitter(config, headerByGetter, extensionPrefix) {
  this.config = Object.assign({}, defaults, config);
  this.headerByGetter = headerByGetter;
  this.extensionPrefix = extensionPrefix;
}

BinaryHTTPEmitter.prototype.emit = function(cloudevent) {
  const config = Object.assign({}, this.config);
  const headers = Object.assign({}, this.config[Constants.HEADERS]);

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

  config[Constants.DATA_ATTRIBUTE] = data;
  config.headers = headers;

  // Return the Promise
  return axios.request(config);
};

module.exports = BinaryHTTPEmitter;
