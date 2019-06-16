const Constants  = require("./constants.js");
const Commons    = require("./commons.js");
const Cloudevent = require("../../cloudevent.js");
const Spec02     = require("../../specs/spec_0_2.js");

var JSONParser = require("../../formats/json/parser.js");

const jsonParserSpec02 = new JSONParser(new Spec02());

const parser_by_mime = {};
parser_by_mime[Constants.MIME_JSON]    = jsonParserSpec02;
parser_by_mime[Constants.MIME_CE_JSON] = jsonParserSpec02;

const allowed_content_types = [];
allowed_content_types.push(Constants.MIME_CE_JSON);

function validate_args(payload, attributes) {
  if(!payload){
    throw {message: "payload is null or undefined"};
  }

  if(!attributes) {
    throw {message: "attributes is null or undefined"};
  }

  if((typeof payload) !== "object" && (typeof payload) !== "string"){
    throw {message: "payload must be an object or string",
             erros: [typeof payload]};
  }
}

function Receiver(configuration) {

}

Receiver.prototype.check = function(payload, headers) {
  validate_args(payload, headers);

  var sanity_headers = Commons.sanity_and_clone(headers);

  // Validation Level 1
  if(!allowed_content_types
      .includes(sanity_headers[Constants.HEADER_CONTENT_TYPE])){
        throw {message: "invalid content type",
              errors: [sanity_headers[Constants.HEADER_CONTENT_TYPE]]};
  }

  // No erros! Its contains the minimum required attributes
}

Receiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  var sanity_headers = Commons.sanity_and_clone(headers);

  var contentType = sanity_headers[Constants.HEADER_CONTENT_TYPE];

  var parser = parser_by_mime[contentType];
  
  var cloudevent = parser.parse(payload);

  return cloudevent;
}

module.exports = Receiver;
