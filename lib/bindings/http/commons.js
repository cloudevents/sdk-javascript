const Constants = require("./constants.js");

// Specific sanity for content-type header
function sanityContentType(contentType) {
  if(contentType) {
    return Array.of(contentType)
              .map((c) => c.split(";"))
              .map((c) => c.shift())
              .shift();
  }

  return contentType;
}

function sanityAndClone(headers) {

  var sanityHeaders = {};

  Array.from(Object.keys(headers))
    .filter((header) => Object.hasOwnProperty.call(headers, header))
    .forEach((header) => {
      sanityHeaders[header.toLowerCase()] = headers[header];
    });

  sanityHeaders[Constants.HEADER_CONTENT_TYPE] =
    sanityContentType(sanityHeaders[Constants.HEADER_CONTENT_TYPE]);

  return sanityHeaders;
}

module.exports = {
  sanityAndClone,
  sanityContentType
};
