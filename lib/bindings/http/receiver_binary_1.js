const Constants  = require("./constants.js");
const Spec     = require("../../specs/spec_1.js");

const JSONParser = require("../../formats/json/parser.js");
const Base64Parser = require("../../formats/base64.js");

const BinaryHTTPReceiver = require("./receiver_binary.js");

const {
  isDefinedOrThrow,
  isStringOrObjectOrThrow,
  isString,
  isBase64
} = require("../../utils/fun.js");

const parserByType = {};
parserByType[Constants.MIME_JSON] = new JSONParser();
parserByType[Constants.MIME_OCTET_STREAM] = {
  parse(payload) { return payload; }
};

const parsersByEncoding = {};
parsersByEncoding[null] = parserByType;
parsersByEncoding[undefined] = parserByType;

// base64
parsersByEncoding[Constants.ENCODING_BASE64] = {};
parsersByEncoding[Constants.ENCODING_BASE64][Constants.MIME_JSON] =
  new JSONParser(new Base64Parser());
parsersByEncoding[Constants.ENCODING_BASE64][Constants.MIME_OCTET_STREAM] = {
  parse(payload) { return payload; }
};

const allowedContentTypes = [];
allowedContentTypes.push(Constants.MIME_JSON);
allowedContentTypes.push(Constants.MIME_OCTET_STREAM);

const allowedEncodings = [];
allowedEncodings.push(Constants.ENCODING_BASE64);

const requiredHeaders = [];
requiredHeaders.push(Constants.BINARY_HEADERS_1.TYPE);
requiredHeaders.push(Constants.BINARY_HEADERS_1.SPEC_VERSION);
requiredHeaders.push(Constants.BINARY_HEADERS_1.SOURCE);
requiredHeaders.push(Constants.BINARY_HEADERS_1.ID);

const setterByHeader = {};
setterByHeader[Constants.BINARY_HEADERS_1.TYPE] = {
  name : "type",
  parser : (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_1.SPEC_VERSION] = {
  name : "specversion",
  parser : (v) => "1.0"
};
setterByHeader[Constants.BINARY_HEADERS_1.SOURCE] = {
  name : "source",
  parser: (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_1.ID] = {
  name : "id",
  parser : (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_1.TIME] = {
  name : "time",
  parser : (v) => new Date(Date.parse(v))
};
setterByHeader[Constants.BINARY_HEADERS_1.DATA_SCHEMA] = {
  name: "dataschema",
  parser: (v) => v
};
setterByHeader[Constants.HEADER_CONTENT_TYPE] = {
  name: "dataContentType",
  parser: (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_1.SUBJECT] = {
  name: "subject",
  parser: (v) => v
};

function checkDecorator(payload, headers) {
}

function Receiver(configuration) {
  this.receiver = new BinaryHTTPReceiver(
    parsersByEncoding,
    setterByHeader,
    allowedContentTypes,
    requiredHeaders,
    Spec,
    Constants.SPEC_V1,
    Constants.BINARY_HEADERS_1.EXTENSIONS_PREFIX,
    checkDecorator
  );
}

Receiver.prototype.check = function(payload, headers) {
  this.receiver.check(payload, headers);
};

Receiver.prototype.parse = function(payload, headers) {
  // firstly specific local checks
  this.check(payload, headers);

  payload = isString(payload) && isBase64(payload)
    ? Buffer.from(payload, "base64").toString()
    : payload;

  return this.receiver.parse(payload, headers);
};

module.exports = Receiver;
