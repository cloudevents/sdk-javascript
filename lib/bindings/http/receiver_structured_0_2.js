const Constants  = require("./constants.js");
const Commons    = require("./commons.js");
const Cloudevent = require("../../cloudevent.js");
const Spec02     = require("../../specs/spec_0_2.js");

var JSONParser = require("../../formats/json/parser.js");

const spec02 = new Spec02();
const jsonParserSpec02 = new JSONParser();

const parser_by_mime = {};
parser_by_mime[Constants.MIME_JSON]    = jsonParserSpec02;
parser_by_mime[Constants.MIME_CE_JSON] = jsonParserSpec02;

const allowed_content_types = [];
allowed_content_types.push(Constants.MIME_CE_JSON);

const setter_reflections = {};
setter_reflections[Constants.STRUCTURED_ATTRS_02.TYPE] = {
  name : "type",
  parser : (v) => v
};
setter_reflections[Constants.STRUCTURED_ATTRS_02.SPEC_VERSION] = {
  name : "specversion",
  parser : (v) => v
};
setter_reflections[Constants.STRUCTURED_ATTRS_02.SOURCE] = {
  name : "source",
  parser: (v) => v
};
setter_reflections[Constants.STRUCTURED_ATTRS_02.ID] = {
  name : "id",
  parser : (v) => v
};
setter_reflections[Constants.STRUCTURED_ATTRS_02.TIME] = {
  name : "time",
  parser : (v) => new Date(Date.parse(v))
};
setter_reflections[Constants.STRUCTURED_ATTRS_02.SCHEMA_URL] = {
  name: "schemaurl",
  parser: (v) => v
};
setter_reflections[Constants.STRUCTURED_ATTRS_02.CONTENT_TYPE] = {
  name: "contenttype",
  parser: (v) => v
};
setter_reflections[Constants.STRUCTURED_ATTRS_02.DATA] = {
  name: "data",
  parser: (v) => v
};

function validate_args(payload, attributes) {
  if(!payload){
    throw {message: "payload is null or undefined"};
  }

  if(!attributes) {
    throw {message: "attributes is null or undefined"};
  }

  if((typeof payload) !== "object" && (typeof payload) !== "string"){
    throw {
      message: "payload must be an object or string",
      errors: [typeof payload]
    };
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
        throw {
          message: "invalid content type",
          errors: [sanity_headers[Constants.HEADER_CONTENT_TYPE]]
        };
  }

  // No erros! Its contains the minimum required attributes
}

Receiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  var sanity_headers = Commons.sanity_and_clone(headers);

  var contentType = sanity_headers[Constants.HEADER_CONTENT_TYPE];

  var parser = parser_by_mime[contentType];
  var event  = parser.parse(payload);
  spec02.check(event);

  var processed_attributes = [];
  var cloudevent = new Cloudevent(Spec02);
  for(attribute in setter_reflections) {
    var setter_name = setter_reflections[attribute].name;
    var parser_fn   = setter_reflections[attribute].parser;

    // invoke the setter function
    cloudevent[setter_name](parser_fn(event[attribute]));

    // to use ahead, for extensions processing
    processed_attributes.push(attribute);
  }

  // Every unprocessed attribute should be an extension
  Array.from(Object.keys(event))
  .filter(attribute => !processed_attributes.includes(attribute))
  .forEach(extension =>
    cloudevent.addExtension(extension, event[extension])
  );

  return cloudevent;
}

module.exports = Receiver;
