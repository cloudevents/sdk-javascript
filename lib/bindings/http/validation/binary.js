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

  const eventObj = {};
  const setterByHeader = receiver.setterByHeader;
  Array.from(Object.keys(setterByHeader))
    .filter((header) => sanityHeaders[header])
    .forEach((header) => {
      eventObj[setterByHeader[header].name] = setterByHeader[header].parser(sanityHeaders[header]);
      delete sanityHeaders[header];
    });

  // Parses the payload
  const parser = receiver.parsersByEncoding[eventObj.dataContentEncoding][eventObj.dataContentType];
  const parsedPayload = parser.parse(payload);
  const cloudevent = new CloudEvent({ source: undefined, type: undefined, ...eventObj, data: parsedPayload });

  // Every unprocessed header can be an extension
  Array.from(Object.keys(sanityHeaders))
    .filter((value)  => value.startsWith(receiver.extensionsPrefix))
    .map((extension) => extension.substring(receiver.extensionsPrefix.length))
    .forEach((extension) => cloudevent.addExtension(extension,
        sanityHeaders[receiver.extensionsPrefix + extension]));

  // Validates the event
  cloudevent.spec.check();
  return cloudevent;
}

module.exports = {
  check, parse
};