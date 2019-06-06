var axios = require("axios");

function HTTPStructured(configuration){
  this.config = configuration;

  this.config["headers"] = {
    "Content-Type":"application/cloudevents+json; charset=utf-8"
  };
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
