const Constants  = require("./constants.js");
const Commons    = require("./commons.js");
const Cloudevent = require("../../cloudevent.js");

const {
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("../../utils/fun.js");

function validateArgs(payload, attributes) {
  Array.of(payload)
    .filter((p) => isDefinedOrThrow(p,
              {message: "payload is null or undefined"}))
    .filter((p) => isStringOrObjectOrThrow(p,
              {message: "payload must be an object or string"}))
    .shift();

  Array.of(attributes)
    .filter((a) => isDefinedOrThrow(a,
                {message: "attributes is null or undefined"}))
    .shift();
}

function StructuredHTTPReceiver(
  parserByMime,
  setterByAttribute,
  allowedContentTypes,
  Spec) {

  this.parserByMime = parserByMime;
  this.setterByAttribute = setterByAttribute;
  this.allowedContentTypes = allowedContentTypes;
  this.Spec = Spec;
  this.spec = new Spec();
}

StructuredHTTPReceiver.prototype.check = function(payload, headers) {
  validateArgs(payload, headers);

  var sanityHeaders = Commons.sanityAndClone(headers);

  // Validation Level 1
  if(!this.allowedContentTypes
      .includes(sanityHeaders[Constants.HEADER_CONTENT_TYPE])){
        throw {
          message: "invalid content type",
          errors: [sanityHeaders[Constants.HEADER_CONTENT_TYPE]]
        };
  }

  // No erros! Its contains the minimum required attributes
};

StructuredHTTPReceiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  var sanityHeaders = Commons.sanityAndClone(headers);

  var contentType = sanityHeaders[Constants.HEADER_CONTENT_TYPE];

  var parser = this.parserByMime[contentType];
  var event  = parser.parse(payload);
  this.spec.check(event);

  var processedAttributes = [];
  var cloudevent = new Cloudevent(this.Spec);

  Array.from(Object.keys(this.setterByAttribute))
    .filter((attribute) => event[attribute])
    .forEach((attribute) => {
      let setterName = this.setterByAttribute[attribute].name;
      let parserFun  = this.setterByAttribute[attribute].parser;

      // invoke the setter function
      cloudevent[setterName](parserFun(event[attribute]));

      // to use ahead, for extensions processing
      processedAttributes.push(attribute);
    });

  // Every unprocessed attribute should be an extension
  Array.from(Object.keys(event))
    .filter((attribute) => !processedAttributes.includes(attribute))
    .forEach((extension) =>
      cloudevent.addExtension(extension, event[extension])
    );

  return cloudevent;
};

module.exports = StructuredHTTPReceiver;
