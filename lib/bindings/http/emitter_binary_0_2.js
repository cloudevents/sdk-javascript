var axios = require("axios");
var empty = require("is-empty");

const Constants = require("./constants.js");

const Headers02 = {
  TYPE              : "ce-type",
  SPEC_VERSION      : "ce-specversion",
  SOURCE            : "ce-source",
  ID                : "ce-id",
  TIME              : "ce-time",
  SCHEMA_URL        : "ce-schemaurl",
  EXTENSIONS_PREFIX : "ce-"
};

const required_headers = [];
required_headers.push(Headers02.TYPE);
required_headers.push(Headers02.SPEC_VERSION);
required_headers.push(Headers02.SOURCE);
required_headers.push(Headers02.ID);

function validate_args(payload, attributes) {
  if(!payload){
    throw {message: "payload is null or undefined"};
  }

  if(!attributes) {
    throw {message: "attributes is null or undefined"};
  }

  if((typeof payload) !== "object"){
    throw {message: "payload must be an object", erros: [typeof payload]};
  }
}

function HTTPBinary02(configuration){
  this.config = configuration;

  if(!this.config["headers"]){
    this.config["headers"] = {};
  }

  this.config["headers"]
    [Constants.HEADER_CONTENT_TYPE] =
      Constants.MIME_CE_JSON + "; charset=" + Constants.CHARSET_DEFAULT;
}

HTTPBinary02.prototype.check = function(payload, headers) {
  // Validation Level 0
  validate_args(payload, headers);

  // Validation Level 1
  for(i in required_headers){
    if(!headers[required_headers[i]]){
      throw {message: "header '" + required_headers[i] + "' not found"};
    }
  }

  // No erros! Its contains the minimum required attributes
}

HTTPBinary02.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  
}

HTTPBinary02.prototype.emit = function(cloudevent){

  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Always set stuff in _config
  var _headers = _config["headers"];

  _headers[Constants.HEADER_CONTENT_TYPE] = cloudevent.getContenttype();

  _headers[Headers02.TYPE] = cloudevent.getType();
  _headers[Headers02.SPEC_VERSION] = cloudevent.getSpecversion();
  _headers[Headers02.SOURCE] = cloudevent.getSource();
  _headers[Headers02.ID] = cloudevent.getId();
  if(cloudevent.getTime()) {
    _headers[Headers02.TIME] = cloudevent.getTime();
  }
  _headers[Headers02.SCHEMA_URL] = cloudevent.getSchemaurl();

  // Set the cloudevent payload
  _config["data"] = cloudevent.format().data;

  // Have extensions?
  var exts = cloudevent.getExtensions();
  for(var ext in exts){
    if({}.hasOwnProperty.call(exts, ext)){
      _headers[Headers02.EXTENSIONS_PREFIX + ext] = exts[ext];
    }
  }

  // Return the Promise
  return axios.request(_config);
};

module.exports = {
  HTTPBinary02,
  Headers02
};
