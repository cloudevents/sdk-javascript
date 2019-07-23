var axios = require("axios");
var empty = require("is-empty");

const Constants = require("./constants.js");

const headerByGetter = {};

headerByGetter["getContenttype"] = {
  name : Constants.HEADER_CONTENT_TYPE,
  parser : (v) => v
};

headerByGetter["getType"] = {
  name : Constants.BINARY_HEADERS_02.TYPE,
  parser : (v) => v
};

headerByGetter["getSpecversion"] = {
  name : Constants.BINARY_HEADERS_02.SPEC_VERSION,
  parser : (v) => v
};

headerByGetter["getSource"] = {
  name : Constants.BINARY_HEADERS_02.SOURCE,
  parser : (v) => v
};

headerByGetter["getId"] = {
  name : Constants.BINARY_HEADERS_02.ID,
  parser : (v) => v
};

headerByGetter["getTime"] = {
  name : Constants.BINARY_HEADERS_02.TIME,
  parser : (v) => v
};

headerByGetter["getSchemaurl"] = {
  name : Constants.BINARY_HEADERS_02.SCHEMA_URL,
  parser : (v) => v
};

function HTTPBinary02(configuration){
  this.config = JSON.parse(JSON.stringify(configuration));

  if(!this.config["headers"]){
    this.config["headers"] = {};
  }

  this.config["headers"]
    [Constants.HEADER_CONTENT_TYPE] =
      Constants.MIME_JSON + "; charset=" + Constants.CHARSET_DEFAULT;
}

HTTPBinary02.prototype.emit = function(cloudevent){

  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Always set stuff in _config
  var _headers = _config["headers"];

  Object.keys(headerByGetter)
    .filter((getter) => cloudevent[getter]())
    .forEach((getter) => {
      let header = headerByGetter[getter];
      _headers[header.name] =
        header.parser(
          cloudevent[getter]()
        );
    });

  // Set the cloudevent payload
  _config["data"] = cloudevent.format().data;

  // Have extensions?
  var exts = cloudevent.getExtensions();
  Object.keys(exts)
    .filter((ext) => Object.hasOwnProperty.call(exts, ext))
    .forEach((ext) => {
      _headers[Constants.BINARY_HEADERS_02.EXTENSIONS_PREFIX + ext] = exts[ext];
    });

  // Return the Promise
  return axios.request(_config);
};

module.exports = {
  HTTPBinary02
};
