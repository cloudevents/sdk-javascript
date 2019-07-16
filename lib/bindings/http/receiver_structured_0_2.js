const Constants  = require("./constants.js");
const Commons    = require("./commons.js");
const Cloudevent = require("../../cloudevent.js");
const Spec02     = require("../../specs/spec_0_2.js");

var JSONParser = require("../../formats/json/parser.js");

const spec02 = new Spec02();
const jsonParserSpec02 = new JSONParser();

const parserByMime = {};
parserByMime[Constants.MIME_JSON]    = jsonParserSpec02;
parserByMime[Constants.MIME_CE_JSON] = jsonParserSpec02;

const allowedContentTypes = [];
allowedContentTypes.push(Constants.MIME_CE_JSON);

const setterReflections = {};
setterReflections[Constants.STRUCTURED_ATTRS_02.TYPE] = {
  name : "type",
  parser : (v) => v
};
setterReflections[Constants.STRUCTURED_ATTRS_02.SPEC_VERSION] = {
  name : "specversion",
  parser : (v) => v
};
setterReflections[Constants.STRUCTURED_ATTRS_02.SOURCE] = {
  name : "source",
  parser: (v) => v
};
setterReflections[Constants.STRUCTURED_ATTRS_02.ID] = {
  name : "id",
  parser : (v) => v
};
setterReflections[Constants.STRUCTURED_ATTRS_02.TIME] = {
  name : "time",
  parser : (v) => new Date(Date.parse(v))
};
setterReflections[Constants.STRUCTURED_ATTRS_02.SCHEMA_URL] = {
  name: "schemaurl",
  parser: (v) => v
};
setterReflections[Constants.STRUCTURED_ATTRS_02.CONTENT_TYPE] = {
  name: "contenttype",
  parser: (v) => v
};
setterReflections[Constants.STRUCTURED_ATTRS_02.DATA] = {
  name: "data",
  parser: (v) => v
};

function validateArgs(payload, attributes) {
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
  validateArgs(payload, headers);

  var sanityHeaders = Commons.sanity_and_clone(headers);

  // Validation Level 1
  if(!allowedContentTypes
      .includes(sanityHeaders[Constants.HEADER_CONTENT_TYPE])){
        throw {
          message: "invalid content type",
          errors: [sanityHeaders[Constants.HEADER_CONTENT_TYPE]]
        };
  }

  // No erros! Its contains the minimum required attributes
}

Receiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  var sanityHeaders = Commons.sanity_and_clone(headers);

  var contentType = sanityHeaders[Constants.HEADER_CONTENT_TYPE];

  var parser = parserByMime[contentType];
  var event  = parser.parse(payload);
  spec02.check(event);

  var processedAttributes = [];
  var cloudevent = new Cloudevent(Spec02);
  for(attribute in setterReflections) {
    var setterName = setterReflections[attribute].name;
    var parserFun   = setterReflections[attribute].parser;

    // invoke the setter function
    cloudevent[setterName](parserFun(event[attribute]));

    // to use ahead, for extensions processing
    processedAttributes.push(attribute);
  }

  // Every unprocessed attribute should be an extension
  Array.from(Object.keys(event))
  .filter(attribute => !processedAttributes.includes(attribute))
  .forEach(extension =>
    cloudevent.addExtension(extension, event[extension])
  );

  return cloudevent;
}

module.exports = Receiver;
