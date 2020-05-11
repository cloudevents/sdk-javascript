const {
  HEADER_CONTENT_TYPE,
  BINARY_HEADERS_03
} = require("./constants.js");

const headerByGetter = {};

headerByGetter.getDataContentType = {
  name: HEADER_CONTENT_TYPE,
  parser: (v) => v
};

headerByGetter.getDataContentEncoding = {
  name: BINARY_HEADERS_03.CONTENT_ENCONDING,
  parser: (v) => v
};

headerByGetter.getSubject = {
  name: BINARY_HEADERS_03.SUBJECT,
  parser: (v) => v
};

headerByGetter.getType = {
  name: BINARY_HEADERS_03.TYPE,
  parser: (v) => v
};

headerByGetter.getSpecversion = {
  name: BINARY_HEADERS_03.SPEC_VERSION,
  parser: (v) => v
};

headerByGetter.getSource = {
  name: BINARY_HEADERS_03.SOURCE,
  parser: (v) => v
};

headerByGetter.getId = {
  name: BINARY_HEADERS_03.ID,
  parser: (v) => v
};

headerByGetter.getTime = {
  name: BINARY_HEADERS_03.TIME,
  parser: (v) => v
};

headerByGetter.getSchemaurl = {
  name: BINARY_HEADERS_03.SCHEMA_URL,
  parser: (v) => v
};

module.exports = headerByGetter;
