const Constants = require("./constants.js");
const Commons = require("./commons.js");
const CloudEvent = require("../../cloudevent.js");
const ValidationError = require("../../validation_error.js");

const {
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("../../utils/fun.js");

function validateArgs(payload, attributes) {
  Array.of(payload)
    .filter((p) => isDefinedOrThrow(p, new ValidationError("payload is null or undefined")))
    .filter((p) => isStringOrObjectOrThrow(p, new ValidationError("payload must be an object or string")))
    .shift();

  Array.of(attributes)
    .filter((a) => isDefinedOrThrow(a, new ValidationError("attributes is null or undefined")))
    .shift();
}

function StructuredHTTPReceiver(
  parserByMime,
  parserMap,
  allowedContentTypes,
  Spec) {
  this.parserByMime = parserByMime;
  this.parserMap = parserMap;
  this.allowedContentTypes = allowedContentTypes;
  this.Spec = Spec;
  this.spec = new Spec();
}

StructuredHTTPReceiver.prototype.check = function(payload, headers) {
  validateArgs(payload, headers);

  const sanityHeaders = Commons.sanityAndClone(headers);

  // Validation Level 1
  if (!this.allowedContentTypes
    .includes(sanityHeaders[Constants.HEADER_CONTENT_TYPE])) {
    throw new ValidationError("invalid content type", [sanityHeaders[Constants.HEADER_CONTENT_TYPE]]);
  }

  // No erros! Its contains the minimum required attributes
};

StructuredHTTPReceiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  const sanityHeaders = Commons.sanityAndClone(headers);

  const contentType = sanityHeaders[Constants.HEADER_CONTENT_TYPE];

  const parser = this.parserByMime[contentType];
  const event = parser.parse(payload);
  this.spec.check(event);

  const processedAttributes = [];
  const cloudevent = new CloudEvent(this.Spec);

  this.parserMap.forEach((value, key) => {
    if (event[key]) {
      // invoke the setter function
      cloudevent[value.name](value.parser(event[key]));

      // to use ahead, for extensions processing
      processedAttributes.push(key);
    }
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
