const {
  HEADER_CONTENT_TYPE,
  BINARY_HEADERS_1
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

  getSubject: {
    name: BINARY_HEADERS_1.SUBJECT,
    parser: passThroughParser
  },

  getType: {
    name: BINARY_HEADERS_1.TYPE,
    parser: passThroughParser
  },

  getSpecversion: {
    name: BINARY_HEADERS_1.SPEC_VERSION,
    parser: passThroughParser
  },

  getSource: {
    name: BINARY_HEADERS_1.SOURCE,
    parser: passThroughParser
  },

  getId: {
    name: BINARY_HEADERS_1.ID,
    parser: passThroughParser
  },

  getTime: {
    name: BINARY_HEADERS_1.TIME,
    parser: passThroughParser
  },

  getDataschema: {
    name: BINARY_HEADERS_1.DATA_SCHEMA,
    parser: passThroughParser
  }
};

module.exports = headerByGetter;
