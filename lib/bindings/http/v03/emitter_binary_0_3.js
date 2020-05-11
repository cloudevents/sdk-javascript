const {
  HEADER_CONTENT_TYPE,
  BINARY_HEADERS_03
} = require("../constants.js");

const passThroughParser = (v) => v;

/**
 * A utility object used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
const headerByGetter = {
  getDataContentType: {
    name: HEADER_CONTENT_TYPE,
    parser: passThroughParser
  },

  getDataContentEncoding: {
    name: BINARY_HEADERS_03.CONTENT_ENCODING,
    parser: passThroughParser
  },

  getSubject: {
    name: BINARY_HEADERS_03.SUBJECT,
    parser: passThroughParser
  },

  getType: {
    name: BINARY_HEADERS_03.TYPE,
    parser: passThroughParser
  },

  getSpecversion: {
    name: BINARY_HEADERS_03.SPEC_VERSION,
    parser: passThroughParser
  },

  getSource: {
    name: BINARY_HEADERS_03.SOURCE,
    parser: passThroughParser
  },

  getId: {
    name: BINARY_HEADERS_03.ID,
    parser: passThroughParser
  },

  getTime: {
    name: BINARY_HEADERS_03.TIME,
    parser: passThroughParser
  },

  getSchemaurl: {
    name: BINARY_HEADERS_03.SCHEMA_URL,
    parser: passThroughParser
  }
};

module.exports = headerByGetter;
