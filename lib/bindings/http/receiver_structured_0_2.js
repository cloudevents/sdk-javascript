const Constants = require("./constants.js");
const Spec02 = require("../../specs/spec_0_2.js");
const JSONParser = require("../../formats/json/parser.js");

const StructuredHTTPReceiver = require("./receiver_structured.js");

const jsonParserSpec02 = new JSONParser();

const parserByMime = {};
parserByMime[Constants.MIME_JSON] = jsonParserSpec02;
parserByMime[Constants.MIME_CE_JSON] = jsonParserSpec02;

const allowedContentTypes = [];
allowedContentTypes.push(Constants.MIME_CE_JSON);

const setterByAttribute = {};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.TYPE] = {
  name: "type",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.SPEC_VERSION] = {
  name: "specversion",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.SOURCE] = {
  name: "source",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.ID] = {
  name: "id",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.TIME] = {
  name: "time",
  parser: (v) => new Date(Date.parse(v))
};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.SCHEMA_URL] = {
  name: "schemaurl",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.CONTENT_TYPE] = {
  name: "contenttype",
  parser: (v) => v
};
setterByAttribute[Constants.STRUCTURED_ATTRS_02.DATA] = {
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
    Spec02
  );
}

Receiver.prototype.check = function(payload, headers) {
  this.receiver.check(payload, headers);
};

Receiver.prototype.parse = function(payload, headers) {
  return this.receiver.parse(payload, headers);
};

module.exports = Receiver;
