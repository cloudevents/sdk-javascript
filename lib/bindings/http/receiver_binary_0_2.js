const Constants  = require("./constants.js");
const Spec02     = require("../../specs/spec_0_2.js");

const JSONParser = require("../../formats/json/parser.js");

const BinaryHTTPReceiver = require("./receiver_binary.js");

const {
  isDefinedOrThrow,
  isStringOrObjectOrThrow
} = require("../../utils/fun.js");

const parserByType = {};
parserByType[Constants.MIME_JSON] = new JSONParser();
parserByType[Constants.MIME_OCTET_STREAM] = {
  parse(payload) { return payload; }
};

const parsersByEncoding = {};
parsersByEncoding[null] = parserByType;
parsersByEncoding[undefined] = parserByType;

const allowedContentTypes = [];
allowedContentTypes.push(Constants.MIME_JSON);
allowedContentTypes.push(Constants.MIME_OCTET_STREAM);

const requiredHeaders = [];
requiredHeaders.push(Constants.BINARY_HEADERS_02.TYPE);
requiredHeaders.push(Constants.BINARY_HEADERS_02.SPEC_VERSION);
requiredHeaders.push(Constants.BINARY_HEADERS_02.SOURCE);
requiredHeaders.push(Constants.BINARY_HEADERS_02.ID);

const setterByHeader = {};
setterByHeader[Constants.BINARY_HEADERS_02.TYPE] = {
  name : "type",
  parser : (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_02.SPEC_VERSION] = {
  name : "specversion",
  parser : (v) => "0.2"
};
setterByHeader[Constants.BINARY_HEADERS_02.SOURCE] = {
  name : "source",
  parser: (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_02.ID] = {
  name : "id",
  parser : (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_02.TIME] = {
  name : "time",
  parser : (v) => new Date(Date.parse(v))
};
setterByHeader[Constants.BINARY_HEADERS_02.SCHEMA_URL] = {
  name: "schemaurl",
  parser: (v) => v
};
setterByHeader[Constants.HEADER_CONTENT_TYPE] = {
  name: "contenttype",
  parser: (v) => v
};

function Receiver(configuration) {
  this.receiver = new BinaryHTTPReceiver(
    parsersByEncoding,
    setterByHeader,
    allowedContentTypes,
    requiredHeaders,
    Spec02,
    Constants.SPEC_V02,
    Constants.BINARY_HEADERS_02.EXTENSIONS_PREFIX
  );
}

Receiver.prototype.check = function(payload, headers) {
  this.receiver.check(payload, headers);
};

Receiver.prototype.parse = function(payload, headers) {
  return this.receiver.parse(payload, headers);
};

module.exports = Receiver;
