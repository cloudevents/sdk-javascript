var Spec02 = require("../../specs/spec_0_2.js");
var JSONParser = require("../../formats/json/parser.js");

const Constants = require("./constants.js");

const structured = "structured";
const binary = "binary";

const jsonParserSpec02 = new JSONParser(new Spec02());
const parsers = {};
parsers[Constants.MIME_JSON]    = jsonParserSpec02;
parsers[Constants.MIME_CE_JSON] = jsonParserSpec02;

const allowed_binary_content_types = [];
allowed_binary_content_types.push(Constants.MIME_JSON);

const allowed_structured_content_types = [];
allowed_structured_content_types.push(Constants.MIME_CE_JSON);

function validate_args(payload, headers) {
  if(!payload){
    throw {message: "payload is null or undefined"};
  }

  if(!headers){
    throw {message: "headers is null or undefined"};
  }

  if(!headers[Constants.HEADER_CONTENT_TYPE]){
    throw {message: "content-type header not found"};
  }
}

// Is it binary or structured?
function resolve_binding_name(payload, headers) {

  var contentType = headers[Constants.HEADER_CONTENT_TYPE];
  if(contentType.startsWith(Constants.MIME_CE)){
    // Structured

    if(allowed_structured_content_types.includes(contentType)){
      return structured;
    } else {
      throw {message: "structured+type not allowed", errors: [contentType]};
    }
  } else {
    // Binary
    if(allowed_binary_content_types.includes(contentType)){
      return binary;
    } else {
      throw {message: "content type not allowed", errors : [contentType]};
    }
  }
}

var Unmarshaller = function() {

}

Unmarshaller.prototype.unmarshall = function(payload, headers) {
  validate_args(payload, headers);

  // Resolve the binding
  var bindingName = resolve_binding_name(payload, headers);
  var contentType = headers[Constants.HEADER_CONTENT_TYPE];

  if(bindingName === structured){
    var parser = parsers[contentType];
    var cloudevent = parser.parse(payload);

    return cloudevent;
  } else {//binary

  }

}

module.exports = Unmarshaller;
