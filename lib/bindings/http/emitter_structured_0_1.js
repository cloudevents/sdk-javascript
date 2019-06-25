var axios = require("axios");

const Constants = require("./constants.js");

function HTTPStructured(configuration){
  this.config = JSON.parse(JSON.stringify(configuration));

  if(!this.config["headers"]){
    this.config["headers"] = {};
  }

  this.config["headers"]
    [Constants.HEADER_CONTENT_TYPE] =
      Constants.MIME_CE_JSON + "; charset=" + Constants.CHARSET_DEFAULT;
}

HTTPStructured.prototype.emit = function(cloudevent){

  // Create new request object
  var _config = JSON.parse(JSON.stringify(this.config));


  // Set the cloudevent payload
  _config["data"] = cloudevent.format();

  // Return the Promise
  return axios.request(_config);
};

module.exports = HTTPStructured;
