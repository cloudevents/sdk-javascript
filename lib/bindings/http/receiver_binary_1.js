const {
  MIME_JSON,
  MIME_OCTET_STREAM,
  ENCODING_BASE64,
  BINARY_HEADERS_1,
  HEADER_CONTENT_TYPE,
  SPEC_V1
} = require("./constants.js");

const Spec = require("../../specs/spec_1.js");
const JSONParser = require("../../formats/json/parser.js");
const Base64Parser = require("../../formats/base64.js");
const BinaryHTTPReceiver = require("./receiver_binary.js");

const {
  isString,
  isBase64
} = require("../../utils/fun.js");

const parserByType = {
  [MIME_JSON] : new JSONParser(),
  [MIME_OCTET_STREAM] : { parse(payload) { return payload; } }
};

const parsersByEncoding = { [null] : parserByType, [undefined] : parserByType, [ENCODING_BASE64] : {} };
parsersByEncoding[ENCODING_BASE64][MIME_JSON] = new JSONParser(new Base64Parser());
parsersByEncoding[ENCODING_BASE64][MIME_OCTET_STREAM] = { 
  parse(payload) { return payload; } 
};

const allowedContentTypes = [MIME_JSON, MIME_OCTET_STREAM];

const requiredHeaders = [BINARY_HEADERS_1.TYPE, BINARY_HEADERS_1.SPEC_VERSION, 
  BINARY_HEADERS_1.SOURCE, BINARY_HEADERS_1.ID];

const setterByHeader = {
  [BINARY_HEADERS_1.TYPE] : { name: "type", parser: (v) => v },
  [BINARY_HEADERS_1.SPEC_VERSION] : { name: "specversion", parser: () => "1.0" },
  [BINARY_HEADERS_1.SOURCE] : { name: "source", parser: (v) => v },
  [BINARY_HEADERS_1.ID] : { name: "id", parser: (v) => v },
  [BINARY_HEADERS_1.TIME] : { name: "time", parser: (v) => new Date(Date.parse(v)) },
  [BINARY_HEADERS_1.DATA_SCHEMA] : { name: "dataschema", parser: (v) => v },
  [HEADER_CONTENT_TYPE] : { name: "dataContentType", parser: (v) => v },
  [BINARY_HEADERS_1.SUBJECT] : { name: "subject", parser: (v) => v }
};

// Leaving these in place for now. TODO: fixme
// eslint-disable-next-line
function checkDecorator(payload, headers) {}

// Leaving this in place for now. TODO: fixme
// eslint-disable-next-line
function Receiver(configuration) {
  this.receiver = new BinaryHTTPReceiver(
    parsersByEncoding,
    setterByHeader,
    allowedContentTypes,
    requiredHeaders,
    Spec,
    SPEC_V1,
    BINARY_HEADERS_1.EXTENSIONS_PREFIX,
    checkDecorator
  );
}

Receiver.prototype.check = function(payload, headers) {
  this.receiver.check(payload, headers);
};

Receiver.prototype.parse = function(payload, headers) {
  payload = isString(payload) && isBase64(payload)
    ? Buffer.from(payload, "base64").toString()
    : payload;

  return this.receiver.parse(payload, headers);
};

module.exports = Receiver;
