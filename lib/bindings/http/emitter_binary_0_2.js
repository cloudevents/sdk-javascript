var axios = require("axios");
var empty = require("is-empty");

function HTTPBinary(configuration){
  this.config = configuration;

  this.config["headers"] = {
    "Content-Type":"application/cloudevents+json; charset=utf-8"
  };
}

HTTPBinary.prototype.emit = function(cloudevent){

  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Always set stuff in _config
  var _headers = _config["headers"];

  _headers["Content-Type"] = cloudevent.getContenttype();

  _headers["ce-type"] = cloudevent.getType();
  _headers["ce-specversion"] = cloudevent.getSpecversion();
  _headers["ce-source"] = cloudevent.getSource();
  _headers["ce-id"] = cloudevent.getId();
  if(cloudevent.getTime()) {
    _headers["ce-time"] = cloudevent.getTime();
  }
  _headers["ce-schemaurl"] = cloudevent.getSchemaurl();

  // Set the cloudevent payload
  _config["data"] = cloudevent.format().data;

  // Have extensions?
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
