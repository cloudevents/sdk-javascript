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
              {message: "payload must be an object or a string"}))
    .shift();

  Array.of(attributes)
    .filter((a) => isDefinedOrThrow(a,
                {message: "attributes is null or undefined"}))
    .shift();
}

function BinaryHTTPReceiver(
  parserByType,
  setterByHeader,
  allowedContentTypes,
  requiredHeaders,
  Spec) {

  this.parserByType = parserByType;
  this.setterByHeader = setterByHeader;
  this.allowedContentTypes = allowedContentTypes;
  this.requiredHeaders = requiredHeaders;
  this.Spec = Spec;
  this.spec = new Spec();
}

BinaryHTTPReceiver.prototype.check = function(payload, headers) {
  // Validation Level 0
  validateArgs(payload, headers);

  // Clone and low case all headers names
  var sanityHeaders = Commons.sanityAndClone(headers);

  // Validation Level 1
  if(!this.allowedContentTypes
      .includes(sanityHeaders[Constants.HEADER_CONTENT_TYPE])){
        throw {
          message: "invalid content type",
          errors: [sanityHeaders[Constants.HEADER_CONTENT_TYPE]]
        };
  }

  this.requiredHeaders
    .filter((required) => !sanityHeaders[required])
    .forEach((required) => {
      throw {message: "header '" + required + "' not found"};
    });

  if(sanityHeaders[Constants.BINARY_HEADERS_02.SPEC_VERSION] !== "0.2"){
    throw {
      message: "invalid spec version",
      errors: [sanityHeaders[Constants.BINARY_HEADERS_02.SPEC_VERSION]]
    };
  }

  // No erros! Its contains the minimum required attributes
};

BinaryHTTPReceiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  // Clone and low case all headers names
  var sanityHeaders = Commons.sanityAndClone(headers);

  var processedHeaders = [];
  var cloudevent = new Cloudevent(this.Spec);

  // dont worry, check() have seen what was required or not
  Array.from(Object.keys(this.setterByHeader))
    .filter((header) => sanityHeaders[header])
    .forEach((header) => {
      var setterName = this.setterByHeader[header].name;
      var parserFun   = this.setterByHeader[header].parser;

      // invoke the setter function
      cloudevent[setterName](parserFun(sanityHeaders[header]));

      // to use ahead, for extensions processing
      processedHeaders.push(header);
    });

  // Parses the payload
  var parsedPayload =
    this.parserByType[sanityHeaders[Constants.HEADER_CONTENT_TYPE]]
          .parse(payload);

  // Every unprocessed header can be an extension
  Array.from(Object.keys(sanityHeaders))
  .filter((value) => !processedHeaders.includes(value))
  .filter((value) =>
    value.startsWith(Constants.BINARY_HEADERS_02.EXTENSIONS_PREFIX))
  .map((extension) =>
    extension.substring(Constants.BINARY_HEADERS_02.EXTENSIONS_PREFIX.length)
  ).forEach((extension) =>
    cloudevent.addExtension(extension,
      sanityHeaders[Constants.BINARY_HEADERS_02.EXTENSIONS_PREFIX+extension])
  );

  // Sets the data
  cloudevent.data(parsedPayload);

  // Checks the event spec
  cloudevent.format();

  // return the result
  return cloudevent;
};

module.exports = BinaryHTTPReceiver;
