const CloudEvent = require("../../../cloudevent.js");

const {
  sanityAndClone,
  validateArgs
} = require("./commons.js");
const ValidationError = require("./validation_error.js");
const {
  HEADER_CONTENT_TYPE,
  MIME_JSON,
  DEFAULT_SPEC_VERSION_HEADER
} = require("../constants.js");

const {
  isString,
  isObject,
  isBase64
} = require("./fun.js");

function check(payload, headers, receiver) {
      // Validation Level 0
  validateArgs(payload, headers);

  // The receiver determines the specification version
  if (!isObject(receiver)) throw new SyntaxError("no receiver");

  // Clone and low case all headers names
  const sanityHeaders = sanityAndClone(headers);

  // Validation Level 1 - if content-type exists, be sure it's
  // an allowed type
  const contentTypeHeader = sanityHeaders[HEADER_CONTENT_TYPE];
  const noContentType = !receiver.allowedContentTypes.includes(contentTypeHeader);
  if (contentTypeHeader && noContentType) {
    throw new ValidationError("invalid content type", [sanityHeaders[HEADER_CONTENT_TYPE]]);
  }

  receiver.requiredHeaders
    .filter((required) => !sanityHeaders[required])
    .forEach((required) => {
      throw new ValidationError(`header '${required}' not found`);
    });

  if (sanityHeaders[DEFAULT_SPEC_VERSION_HEADER] !== receiver.specversion) {
    throw new ValidationError("invalid spec version", [sanityHeaders[DEFAULT_SPEC_VERSION_HEADER]]);
  }
  return true;
}

function parse(payload, headers, receiver) {
  payload = isString(payload) && isBase64(payload)
    ? Buffer.from(payload, "base64").toString()
    : payload;

  check(payload, headers, receiver);

  // Clone and low case all headers names
  const sanityHeaders = sanityAndClone(headers);
  if (!sanityHeaders[HEADER_CONTENT_TYPE]) {
    sanityHeaders[HEADER_CONTENT_TYPE] = MIME_JSON;
  }

  const processedHeaders = [];
  const cloudevent = new CloudEvent(receiver.Spec);

  const setterByHeader = receiver.setterByHeader;
  // dont worry, check() have seen what was required or not
  Array.from(Object.keys(setterByHeader))
    .filter((header) => sanityHeaders[header])
    .forEach((header) => {
      const setterName = setterByHeader[header].name;
      const parserFun = setterByHeader[header].parser;

      // invoke the setter function
      cloudevent[setterName](parserFun(sanityHeaders[header]));

      // to use ahead, for extensions processing
      processedHeaders.push(header);
    });

  // Parses the payload
  const parsedPayload =
    parserFor(receiver.parsersByEncoding, cloudevent, sanityHeaders)
      .parse(payload);

  // Every unprocessed header can be an extension
  Array.from(Object.keys(sanityHeaders))
    .filter((value)  => !processedHeaders.includes(value))
    .filter((value)  => value.startsWith(receiver.extensionsPrefix))
    .map((extension) => extension.substring(receiver.extensionsPrefix.length)
    ).forEach((extension) => cloudevent.addExtension(extension,
        sanityHeaders[receiver.extensionsPrefix + extension])
    );

  // Sets the data
  cloudevent.data(parsedPayload);

  // Checks the event spec
  cloudevent.format();

  // return the result
  return cloudevent;
}

function parserFor(parsersByEncoding, cloudevent, headers) {
  const encoding = cloudevent.spec.payload.datacontentencoding;
  return parsersByEncoding[encoding][headers[HEADER_CONTENT_TYPE]];
}

module.exports = {
  check, parse
};