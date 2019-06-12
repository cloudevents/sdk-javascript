var axios = require("axios");
var empty = require("is-empty");

const Constants = require("./constants.js");

const required_headers = [];
required_headers.push(Constants.BINARY_HEADERS_02.TYPE);
required_headers.push(Constants.BINARY_HEADERS_02.SPEC_VERSION);
required_headers.push(Constants.BINARY_HEADERS_02.SOURCE);
required_headers.push(Constants.BINARY_HEADERS_02.ID);

const setter_reflections = {};
setter_reflections[Constants.BINARY_HEADERS_02.TYPE] = "type";
setter_reflections[Constants.BINARY_HEADERS_02.SOURCE] = "source";
setter_reflections[Constants.BINARY_HEADERS_02.ID] = "id";
setter_reflections[Constants.BINARY_HEADERS_02.TIME] = "time";
setter_reflections[Constants.BINARY_HEADERS_02.SCHEMA_URL] = "schemaurl";

function HTTPBinary02(configuration){
  this.config = configuration;

  if(!this.config["headers"]){
    this.config["headers"] = {};
  }

  this.config["headers"]
    [Constants.HEADER_CONTENT_TYPE] =
      Constants.MIME_CE_JSON + "; charset=" + Constants.CHARSET_DEFAULT;
}

HTTPBinary02.prototype.emit = function(cloudevent){

  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Always set stuff in _config
  var _headers = _config["headers"];

  _headers[Constants.HEADER_CONTENT_TYPE] = cloudevent.getContenttype();

  _headers[Constants.BINARY_HEADERS_02.TYPE] = cloudevent.getType();
  _headers[Constants.BINARY_HEADERS_02.SPEC_VERSION] =
    cloudevent.getSpecversion();
  _headers[Constants.BINARY_HEADERS_02.SOURCE] = cloudevent.getSource();
  _headers[Constants.BINARY_HEADERS_02.ID] = cloudevent.getId();
  if(cloudevent.getTime()) {
    _headers[Constants.BINARY_HEADERS_02.TIME] = cloudevent.getTime();
  }
  _headers[Constants.BINARY_HEADERS_02.SCHEMA_URL] = cloudevent.getSchemaurl();

  // Set the cloudevent payload
  _config["data"] = cloudevent.format().data;

  // Have extensions?
  var exts = cloudevent.getExtensions();
  for(var ext in exts){
    if({}.hasOwnProperty.call(exts, ext)){
      _headers[Constants.BINARY_HEADERS_02.EXTENSIONS_PREFIX + ext] = exts[ext];
    }
  }

  // Return the Promise
  return axios.request(_config);
};

module.exports = {
  HTTPBinary02
};
