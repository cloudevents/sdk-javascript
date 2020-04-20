const StructuredReceiver = require("./receiver_structured_0_2.js");
const BinaryReceiver     = require("./receiver_binary_0_2.js");

const Constants = require("./constants.js");
const Commons   = require("./commons.js");

const STRUCTURED = "structured";
const BINARY = "binary";

const receiverByBinding = {
  structured : new StructuredReceiver(),
  binary     : new BinaryReceiver(),
};

const allowedBinaryContentTypes = [];
allowedBinaryContentTypes.push(Constants.MIME_JSON);
allowedBinaryContentTypes.push(Constants.MIME_OCTET_STREAM);

const allowedStructuredContentTypes = [];
allowedStructuredContentTypes.push(Constants.MIME_CE_JSON);

function validateArgs(payload, headers) {
  if(!payload){
    throw {message: "payload is null or undefined"};
  }

  if(!headers){
    throw {message: "headers is null or undefined"};
  }
}

// Is it binary or structured?
function resolveBindingName(payload, headers) {

  const contentType =
    Commons.sanityContentType(headers[Constants.HEADER_CONTENT_TYPE]);

  if(contentType.startsWith(Constants.MIME_CE)){
    // Structured
    if(allowedStructuredContentTypes.includes(contentType)){
      return STRUCTURED;
    } else {
      throw {message: "structured+type not allowed", errors: [contentType]};
    }
  } else {
    // Binary
    if(allowedBinaryContentTypes.includes(contentType)){
      return BINARY;
    } else {
      throw {message: "content type not allowed", errors : [contentType]};
    }
  }
}

const Unmarshaller = function(receiverByBinding) {
  this.receiverByBinding = receiverByBinding;
};

Unmarshaller.prototype.unmarshall = function(payload, headers) {
  return new Promise((resolve, reject) => {
    try {
      validateArgs(payload, headers);

      const sanityHeaders = Commons.sanityAndClone(headers);

      // Validation level 1
      if(!sanityHeaders[Constants.HEADER_CONTENT_TYPE]){
        throw {message: "content-type header not found"};
      }

      // Resolve the binding
      const bindingName = resolveBindingName(payload, sanityHeaders);

      const cloudevent =
        this.receiverByBinding[bindingName].parse(payload, sanityHeaders);

      resolve(cloudevent);
    }catch(e){
      reject(e);
    }
  });
};

module.exports = Unmarshaller;
