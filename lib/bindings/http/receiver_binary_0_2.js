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

function Receiver(configuration) {

}

Receiver.prototype.check = function(payload, headers) {
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

Receiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  for(setter in setter_reflections) {

  }
}

module.exports = Receiver;
