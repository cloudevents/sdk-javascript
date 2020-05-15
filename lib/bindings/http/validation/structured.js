const CloudEvent = require("../../../cloudevent.js");
const ValidationError = require("./validation_error.js");
const {
  sanityAndClone,
  validateArgs
} = require("./commons.js");
const {
  HEADER_CONTENT_TYPE
} = require("../constants.js");

function check(payload, headers, receiver) {
  validateArgs(payload, headers);

  const sanityHeaders = sanityAndClone(headers);

  // Validation Level 1
  if (!receiver.allowedContentTypes
    .includes(sanityHeaders[HEADER_CONTENT_TYPE])) {
    throw new ValidationError("invalid content type", [sanityHeaders[HEADER_CONTENT_TYPE]]);
  }
}

function parse(payload, headers, receiver) {
  check(payload, headers, receiver);

  const sanityHeaders = sanityAndClone(headers);

  const contentType = sanityHeaders[HEADER_CONTENT_TYPE];

  const parser = receiver.parserByMime[contentType];
  const event = parser.parse(payload);
  receiver.spec.check(event);

  const processedAttributes = [];
  const cloudevent = new CloudEvent(receiver.Spec);

  receiver.parserMap.forEach((value, key) => {
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
}

module.exports = { parse, check };