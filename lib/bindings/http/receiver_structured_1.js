const Constants = require("./constants.js");
const Spec = require("../../specs/spec_1.js");
const JSONParser = require("../../formats/json/parser.js");

const StructuredHTTPReceiver = require("./receiver_structured.js");

const jsonParserSpec = new JSONParser();

const parserByMime = {};
parserByMime[Constants.MIME_JSON] = jsonParserSpec;
parserByMime[Constants.MIME_CE_JSON] = jsonParserSpec;

const allowedContentTypes = [];
allowedContentTypes.push(Constants.MIME_CE_JSON);

const setterByAttribute = {};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.TYPE] = {
  name: "type",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.SPEC_VERSION] = {
  name: "specversion",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.SOURCE] = {
  name: "source",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.ID] = {
  name: "id",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.TIME] = {
  name: "time",
  parser: (v) => new Date(Date.parse(v))
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.DATA_SCHEMA] = {
  name: "dataschema",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.CONTENT_TYPE] = {
  name: "dataContentType",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.SUBJECT] = {
  name: "subject",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.DATA] = {
  name: "data",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_1.DATA_BASE64] = {
  name: "data",
  parser: (v) => v
};

// Leaving this in place for now. TODO: fixme
// eslint-disable-next-line
function Receiver(configuration) {
  this.receiver = new StructuredHTTPReceiver(
    parserByMime,
    setterByAttribute,
    allowedContentTypes,
    Spec
  );
}

Receiver.prototype.check = function(payload, headers) {
  this.receiver.check(payload, headers);
};

Receiver.prototype.parse = function(payload, headers) {
  return this.receiver.parse(payload, headers);
};

module.exports = Receiver;
