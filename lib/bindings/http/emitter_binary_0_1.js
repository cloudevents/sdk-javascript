var axios = require("axios");

const Constants = require("./constants.js");

const headerByGetter = {};

headerByGetter["getContenttype"] = {
  name : Constants.HEADER_CONTENT_TYPE,
  parser : (v) => v
};

headerByGetter["getType"] = {
  name : "CE-EventType",
  parser : (v) => v
};

headerByGetter["getSpecversion"] = {
  name : "CE-CloudEventsVersion",
  parser : (v) => v
};

headerByGetter["getSource"] = {
  name : "CE-Source",
  parser : (v) => v
};

headerByGetter["getId"] = {
  name : "CE-EventID",
  parser : (v) => v
};

headerByGetter["getEventTypeVersion"] = {
  name : "CE-EventTypeVersion",
  parser : (v) => v
};

headerByGetter["getTime"] = {
  name : "CE-EventTime",
  parser : (v) => v
};

headerByGetter["getSchemaurl"] = {
  name : "CE-SchemaURL",
  parser : (v) => v
};

function HTTPBinary(configuration){
  this.config = JSON.parse(JSON.stringify(configuration));

  if(!this.config["headers"]){
    this.config["headers"] = {};
  }

  this.config["headers"]
    [Constants.HEADER_CONTENT_TYPE] =
      Constants.MIME_JSON + "; charset=" + Constants.CHARSET_DEFAULT;
}

HTTPBinary.prototype.emit = function(cloudevent){

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

  // EXTENSION CONTEXT ATTRIBUTES
  var exts = cloudevent.getExtensions();
  Object.keys(exts)
    .filter((ext) => Object.hasOwnProperty.call(exts, ext))
    .forEach((ext) => {
      let capsExt = ext.charAt(0).toUpperCase() + ext.slice(1);
      _headers["CE-X-" + capsExt] = exts[ext];
    });

  // Return the Promise
  return axios.request(_config);
};

module.exports = HTTPBinary;
