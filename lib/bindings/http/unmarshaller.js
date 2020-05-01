const Constants = require("./constants.js");
const Commons = require("./commons.js");

const STRUCTURED = "structured";
const BINARY = "binary";

const allowedBinaryContentTypes = [
  Constants.MIME_JSON,
  Constants.MIME_OCTET_STREAM
];

const allowedStructuredContentTypes = [
  Constants.MIME_CE_JSON
];

// Is it binary or structured?
function resolveBindingName(payload, headers) {
  const contentType =
    Commons.sanityContentType(headers[Constants.HEADER_CONTENT_TYPE]);

  if (contentType.startsWith(Constants.MIME_CE)) {
    // Structured
    if (allowedStructuredContentTypes.includes(contentType)) {
      return STRUCTURED;
    } else {
      const err = new TypeError("structured+type not allowed");
      err.errors = [contentType];
      throw err;
    }
  } else {
    // Binary
    if (allowedBinaryContentTypes.includes(contentType)) {
      return BINARY;
    } else {
      const err = new TypeError("content type not allowed");
      err.errors = [contentType];
      throw err;
    }
  }
}

class Unmarshaller {
  constructor(receiverByBinding) {
    this.receiverByBinding = receiverByBinding;
  }

  unmarshall(payload, headers) {
    return new Promise((resolve, reject) => {
      if (!payload) {
        return reject(new TypeError("payload is null or undefined"));
      }
      if (!headers) {
        return reject(new TypeError("headers is null or undefined"));
      }

<<<<<<< HEAD
      // Validation level 1
      const sanityHeaders = Commons.sanityAndClone(headers);
=======
      const sanityHeaders = Commons.sanityAndClone(headers);

      // Validation level 1
>>>>>>> c722b03... fix: fix pr suggestion errors
      if (!sanityHeaders[Constants.HEADER_CONTENT_TYPE]) {
        throw new TypeError("content-type header not found");
      }

      // Resolve the binding
      const bindingName = resolveBindingName(payload, sanityHeaders);
      const cloudevent = this.receiverByBinding[bindingName]
        .parse(payload, sanityHeaders);

      resolve(cloudevent);
    });
  }
}

module.exports = Unmarshaller;
