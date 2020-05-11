const {
  HEADER_CONTENT_TYPE,
  BINARY_HEADERS_1
} = require("./constants.js");

const headerByGetter = {};

headerByGetter.getDataContentType = {
  name: HEADER_CONTENT_TYPE,
  parser: (v) => v
};

headerByGetter.getSubject = {
  name: BINARY_HEADERS_1.SUBJECT,
  parser: (v) => v
};

headerByGetter.getType = {
  name: BINARY_HEADERS_1.TYPE,
  parser: (v) => v
};

headerByGetter.getSpecversion = {
  name: BINARY_HEADERS_1.SPEC_VERSION,
  parser: (v) => v
};

headerByGetter.getSource = {
  name: BINARY_HEADERS_1.SOURCE,
  parser: (v) => v
};

headerByGetter.getId = {
  name: BINARY_HEADERS_1.ID,
  parser: (v) => v
};

headerByGetter.getTime = {
  name: BINARY_HEADERS_1.TIME,
  parser: (v) => v
};

headerByGetter.getDataschema = {
  name: BINARY_HEADERS_1.DATA_SCHEMA,
  parser: (v) => v
};

module.exports = headerByGetter;
