const Constants  = require("./constants.js");
const Commons    = require("./commons.js");
const Cloudevent = require("../../cloudevent.js");
const Spec02     = require("../../specs/spec_0_2.js");

const allowed_content_types = [];
allowed_content_types.push(Constants.MIME_JSON);

const required_headers = [];
required_headers.push(Constants.BINARY_HEADERS_02.TYPE);
required_headers.push(Constants.BINARY_HEADERS_02.SPEC_VERSION);
required_headers.push(Constants.BINARY_HEADERS_02.SOURCE);
required_headers.push(Constants.BINARY_HEADERS_02.ID);

const setter_reflections = {};
setter_reflections[Constants.BINARY_HEADERS_02.TYPE] = {
  name : "type",
  parser : (v) => v
};
setter_reflections[Constants.BINARY_HEADERS_02.SOURCE] = {
  name : "source",
  parser: (v) => v
};
setter_reflections[Constants.BINARY_HEADERS_02.ID] = {
  name : "id",
  parser : (v) => v
};
setter_reflections[Constants.BINARY_HEADERS_02.TIME] = {
  name : "time",
  parser : (v) => new Date(Date.parse(v))
};
setter_reflections[Constants.BINARY_HEADERS_02.SCHEMA_URL] = {
  name: "schemaurl",
  parser: (v) => v
};
setter_reflections[Constants.HEADER_CONTENT_TYPE] = {
  name: "contenttype",
  parser: (v) => v
};

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

  // Clone and low case all headers names
  var sanity_headers = Commons.sanity_and_clone(headers);

  // Validation Level 1
  if(!allowed_content_types
      .includes(sanity_headers[Constants.HEADER_CONTENT_TYPE])){
        throw {message: "invalid content type",
              errors: [sanity_headers[Constants.HEADER_CONTENT_TYPE]]};
  }

  for(i in required_headers){
    if(!sanity_headers[required_headers[i]]){
      throw {message: "header '" + required_headers[i] + "' not found"};
    }
  }

  if(sanity_headers[Constants.BINARY_HEADERS_02.SPEC_VERSION] !== "0.2"){
    throw {message: "invalid spec version",
            errors:
              [sanity_headers[Constants.BINARY_HEADERS_02.SPEC_VERSION]]};
  }

  // No erros! Its contains the minimum required attributes
}

Receiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  // Clone and low case all headers names
  var sanity_headers = Commons.sanity_and_clone(headers);

  var cloudevent = new Cloudevent(Spec02);
  for(header in setter_reflections) {
    // dont worry, check() have seen what was required or not
    if(sanity_headers[header]){
      var setter_name = setter_reflections[header].name;
      var parser_fn   = setter_reflections[header].parser;

      // invoke the setter function
      cloudevent[setter_name](parser_fn(sanity_headers[header]));
    }
  }

  // Sets the data
  cloudevent.data(payload);

  // Checks the event spec
  cloudevent.format();

  // return the result
  return cloudevent;
}

module.exports = Receiver;
