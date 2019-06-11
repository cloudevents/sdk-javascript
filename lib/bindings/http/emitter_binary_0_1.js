var axios = require("axios");

const Constants = require("./constants.js");

function HTTPBinary(configuration){
  this.config = configuration;

  this.config["headers"] = {};

  this.config["headers"]
    [Constants.HEADER_CONTENT_TYPE] =
      Constants.MIME_CE_JSON + "; charset=" + Constants.CHARSET_DEFAULT;
}

HTTPBinary.prototype.emit = function(cloudevent){

  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));

  // Always set stuff in _config
  var _headers = _config["headers"];

  if(cloudevent.getContenttype()) {
    _headers[Constants.HEADER_CONTENT_TYPE] = cloudevent.getContenttype();
  }

  _headers["CE-EventType"] = cloudevent.getType();
  if(cloudevent.getEventTypeVersion()) {
    _headers["CE-EventTypeVersion"] = cloudevent.getEventTypeVersion();
  }
  _headers["CE-CloudEventsVersion"] = cloudevent.getSpecversion();
  _headers["CE-Source"] = cloudevent.getSource();
  _headers["CE-EventID"] = cloudevent.getId();
  if(cloudevent.getTime()) {
    _headers["CE-EventTime"] = cloudevent.getTime();
  }
  _headers["CE-SchemaURL"] = cloudevent.getSchemaurl();

  // Set the cloudevent payload
  _config["data"] = cloudevent.format().data;

  // Return the Promise
  return axios.request(_config);
};

module.exports = HTTPBinary;
