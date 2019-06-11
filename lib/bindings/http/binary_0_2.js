var axios = require("axios");
var empty = require("is-empty");

function HTTPBinary(configuration){
  this.config = JSON.parse(JSON.stringify(configuration));

  this.config["headers"] = {
    "Content-Type":"application/json; charset=utf-8"
  };
}

HTTPBinary.prototype.emit = function(cloudevent){

  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Always set stuff in _config
  var _headers = _config["headers"];

  // OPTIONAL CONTENT TYPE ATTRIBUTE
  if (cloudevent.getContenttype()) {
    _headers["Content-Type"] = cloudevent.getContenttype();
  }

  // REQUIRED ATTRIBUTES
  _headers["ce-type"] = cloudevent.getType();
  _headers["ce-specversion"] = cloudevent.getSpecversion();
  _headers["ce-source"] = cloudevent.getSource();
  _headers["ce-id"] = cloudevent.getId();

  // OPTIONAL ATTRIBUTES
  if (cloudevent.getTime()) {
    _headers["ce-time"] = cloudevent.getTime();
  }
  if (cloudevent.getSchemaurl()) {
    _headers["ce-schemaurl"] = cloudevent.getSchemaurl();
  }

  // Set the cloudevent payload
  _config["data"] = cloudevent.format().data;

  // EXTENSION CONTEXT ATTRIBUTES
  var exts = cloudevent.getExtensions(); 
  for(var ext in exts){
    if({}.hasOwnProperty.call(exts, ext)){
      _headers["ce-" + ext] = exts[ext];
    }
  }

  // Return the Promise
  return axios.request(_config);
};

module.exports = HTTPBinary;
