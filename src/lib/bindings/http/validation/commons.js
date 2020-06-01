const ValidationError = require("./validation_error.js");
const Constants = require("../constants");
const {
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("./fun.js");


// Specific sanity for content-type header
function sanityContentType(contentType) {
  if (contentType) {
    return Array.of(contentType)
      .map((c) => c.split(";"))
      .map((c) => c.shift())
      .shift();
  }

  return contentType;
}

function sanityAndClone(headers) {
  const sanityHeaders = {};

  Array.from(Object.keys(headers))
    .filter((header) => Object.hasOwnProperty.call(headers, header))
    .forEach((header) => {
      sanityHeaders[header.toLowerCase()] = headers[header];
    });

  sanityHeaders[Constants.HEADER_CONTENT_TYPE] =
    sanityContentType(sanityHeaders[Constants.HEADER_CONTENT_TYPE]);

  return sanityHeaders;
}

function validateArgs(payload, attributes) {
  Array.of(payload)
    .filter((p) => isDefinedOrThrow(p, new ValidationError("payload is null or undefined")))
    .filter((p) => isStringOrObjectOrThrow(p, new ValidationError("payload must be an object or a string")))
    .shift();

  Array.of(attributes)
    .filter((a) => isDefinedOrThrow(a, new ValidationError("attributes is null or undefined")))
    .shift();
}

module.exports = {
  sanityAndClone,
  sanityContentType,
  validateArgs
};
