const { HEADER_CONTENT_TYPE, MIME_JSON, DEFAULT_SPEC_VERSION_HEADER } =
  require("./constants.js");
const Commons = require("./commons.js");
const CloudEvent = require("../../cloudevent.js");

const {
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("../../utils/fun.js");

function validateArgs(payload, attributes) {
  Array.of(payload)
    .filter((p) => isDefinedOrThrow(p,
      { message: "payload is null or undefined" }))
    .filter((p) => isStringOrObjectOrThrow(p,
      { message: "payload must be an object or a string" }))
    .shift();

  Array.of(attributes)
    .filter((a) => isDefinedOrThrow(a,
      { message: "attributes is null or undefined" }))
    .shift();
}

function BinaryHTTPReceiver(
  parsersByEncoding,
  setterByHeader,
  allowedContentTypes,
  requiredHeaders,
  Spec,
  specversion,
  extensionsPrefix,
  checkDecorator) {
  this.parsersByEncoding = parsersByEncoding;
  this.setterByHeader = setterByHeader;
  this.allowedContentTypes = allowedContentTypes;
  this.requiredHeaders = requiredHeaders;
  this.Spec = Spec;
  this.spec = new Spec();
  this.specversion = specversion;
  this.extensionsPrefix = extensionsPrefix;
  this.checkDecorator = checkDecorator;
}

BinaryHTTPReceiver.prototype.check = function(payload, headers) {
  // Validation Level 0
  validateArgs(payload, headers);

  if (this.checkDecorator) {
    this.checkDecorator(payload, headers);
  }

  // Clone and low case all headers names
  const sanityHeaders = Commons.sanityAndClone(headers);

  // Validation Level 1 - if content-type exists, be sure it's
  // an allowed type
  if (sanityHeaders[HEADER_CONTENT_TYPE] && !this.allowedContentTypes
    .includes(sanityHeaders[HEADER_CONTENT_TYPE])) {
    const err = new TypeError("invalid content type");
    err.errors = [sanityHeaders[HEADER_CONTENT_TYPE]];
    throw err;
  }

  this.requiredHeaders
    .filter((required) => !sanityHeaders[required])
    .forEach((required) => {
      throw new TypeError(`header '${required}' not found`);
    });

  if (sanityHeaders[DEFAULT_SPEC_VERSION_HEADER] !==
    this.specversion) {
    const err = new TypeError("invalid spec version");
    err.errors = [sanityHeaders[DEFAULT_SPEC_VERSION_HEADER]];
    throw err;
  }

  // No erros! Its contains the minimum required attributes
};

function parserFor(parsersByEncoding, cloudevent, headers) {
  const encoding = cloudevent.spec.payload.datacontentencoding;
  return parsersByEncoding[encoding][headers[HEADER_CONTENT_TYPE]];
}

BinaryHTTPReceiver.prototype.parse = function(payload, headers) {
  this.check(payload, headers);

  // Clone and low case all headers names
  const sanityHeaders = Commons.sanityAndClone(headers);
  if (!sanityHeaders[HEADER_CONTENT_TYPE]) {
    sanityHeaders[HEADER_CONTENT_TYPE] = MIME_JSON;
  }

  const processedHeaders = [];
  const cloudevent = new CloudEvent(this.Spec);

  // dont worry, check() have seen what was required or not
  Array.from(Object.keys(this.setterByHeader))
    .filter((header) => sanityHeaders[header])
    .forEach((header) => {
      const setterName = this.setterByHeader[header].name;
      const parserFun = this.setterByHeader[header].parser;

      // invoke the setter function
      cloudevent[setterName](parserFun(sanityHeaders[header]));

      // to use ahead, for extensions processing
      processedHeaders.push(header);
    });

  // Parses the payload
  const parsedPayload =
      parserFor(this.parsersByEncoding, cloudevent, sanityHeaders)
        .parse(payload);

  // Every unprocessed header can be an extension
  Array.from(Object.keys(sanityHeaders))
    .filter((value) => !processedHeaders.includes(value))
    .filter((value) =>
      value.startsWith(this.extensionsPrefix))
    .map((extension) =>
      extension.substring(this.extensionsPrefix.length)
    ).forEach((extension) =>
      cloudevent.addExtension(extension,
        sanityHeaders[this.extensionsPrefix + extension])
    );

  // Sets the data
  cloudevent.data(parsedPayload);

  // Checks the event spec
  cloudevent.format();

  // return the result
  return cloudevent;
};

module.exports = BinaryHTTPReceiver;
