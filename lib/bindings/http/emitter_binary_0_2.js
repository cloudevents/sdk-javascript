var axios = require("axios");
var empty = require("is-empty");

const Constants = require("./constants.js");

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

  // OPTIONAL CONTENT TYPE ATTRIBUTE
  if (cloudevent.getContenttype()) {
    _headers[Constants.HEADER_CONTENT_TYPE] = cloudevent.getContenttype();
  }

  _headers[Constants.BINARY_HEADERS_02.TYPE] = cloudevent.getType();
  _headers[Constants.BINARY_HEADERS_02.SPEC_VERSION] =
    cloudevent.getSpecversion();
  _headers[Constants.BINARY_HEADERS_02.SOURCE] = cloudevent.getSource();
  _headers[Constants.BINARY_HEADERS_02.ID] = cloudevent.getId();

  if(cloudevent.getTime()) {
    _headers[Constants.BINARY_HEADERS_02.TIME] = cloudevent.getTime();
  }

  if (cloudevent.getSchemaurl()) {
    _headers[Constants.BINARY_HEADERS_02.SCHEMA_URL] = cloudevent.getSchemaurl();
  }

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
