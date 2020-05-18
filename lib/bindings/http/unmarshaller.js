const {
  HEADER_CONTENT_TYPE,
  MIME_CE,
  MIME_CE_JSON,
  MIME_JSON,
  MIME_OCTET_STREAM,
  BINARY,
  STRUCTURED
} = require("./constants.js");
const Commons = require("./commons.js");
const ValidationError = require("../../validation_error.js");

const allowedBinaryContentTypes = [
  MIME_JSON,
  MIME_OCTET_STREAM
];

const allowedStructuredContentTypes = [
  MIME_CE_JSON
];

// Is it binary or structured?
function resolveBindingName(payload, headers) {
  const contentType =
    Commons.sanityContentType(headers[HEADER_CONTENT_TYPE]);

  if (contentType.startsWith(MIME_CE)) {
    // Structured
    if (allowedStructuredContentTypes.includes(contentType)) {
      return STRUCTURED;
    }
    throwValidationError("structured+type not allowed", contentType);
  } else {
    // Binary
    if (allowedBinaryContentTypes.includes(contentType)) {
      return BINARY;
    }
    throwValidationError("content type not allowed", contentType);
  }
}

function throwValidationError(msg, contentType) {
  const err = new ValidationError(msg);
  err.errors = [contentType];
  throw err;
}

class Unmarshaller {
  constructor(receiverByBinding) {
    this.receiverByBinding = receiverByBinding;
  }

  unmarshall(payload, headers) {
    if (!payload) {
      throw new ValidationError("payload is null or undefined");
    }
    if (!headers) {
      throw new ValidationError("headers is null or undefined");
    }

    // Validation level 1
    const sanityHeaders = Commons.sanityAndClone(headers);
    if (!sanityHeaders[HEADER_CONTENT_TYPE]) {
      throw new ValidationError("content-type header not found");
    }

    // Resolve the binding
    const bindingName = resolveBindingName(payload, sanityHeaders);
    const cloudevent = this.receiverByBinding[bindingName]
      .parse(payload, sanityHeaders);

    return cloudevent;
  }
}

module.exports = Unmarshaller;
