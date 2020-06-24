const { CloudEvent } = require("../../../cloudevent");
const ValidationError = require("./validation_error.js");
const {
  sanityAndClone,
  validateArgs
} = require("./commons.js");
const {
  HEADER_CONTENT_TYPE
} = require("../constants");

function check(payload, headers, receiver) {
  validateArgs(payload, headers);

  const sanityHeaders = sanityAndClone(headers);

  // Validation Level 1
  if (!receiver.allowedContentTypes.includes(sanityHeaders[HEADER_CONTENT_TYPE])) {
    throw new ValidationError("invalid content type", [sanityHeaders[HEADER_CONTENT_TYPE]]);
  }
  return true;
}

function parse(payload, headers, receiver) {
  check(payload, headers, receiver);

  const sanityHeaders = sanityAndClone(headers);
  const contentType = sanityHeaders[HEADER_CONTENT_TYPE];
  const parser = receiver.parserByMime[contentType];
  const incoming = { ...parser.parse(payload) };
  const event = {
    type: undefined,
    source: undefined
  };

  receiver.parserMap.forEach((value, key) => {
    if (incoming[key]) {
      event[value.name] = value.parser(incoming[key]);
      delete incoming[key];
    }
  });

  const cloudevent = new CloudEvent(event);

  // Every unprocessed attribute should be an extension
  Array.from(Object.keys(incoming)).forEach((extension) =>
    cloudevent.addExtension(extension, incoming[extension]));

  cloudevent.spec.check();
  return cloudevent;
}

module.exports = { parse, check };