const Constants  = require("./constants.js");
const Spec     = require("../../specs/spec_0_3.js");

const JSONParser = require("../../formats/json/parser.js");
const Base64Parser = require("../../formats/base64.js");

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
requiredHeaders.push(Constants.BINARY_HEADERS_03.TYPE);
requiredHeaders.push(Constants.BINARY_HEADERS_03.SPEC_VERSION);
requiredHeaders.push(Constants.BINARY_HEADERS_03.SOURCE);
requiredHeaders.push(Constants.BINARY_HEADERS_03.ID);

const setterByHeader = {};
setterByHeader[Constants.BINARY_HEADERS_03.TYPE] = {
  name : "type",
  parser : (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_03.SPEC_VERSION] = {
  name : "specversion",
  parser : (v) => "0.3"
};
setterByHeader[Constants.BINARY_HEADERS_03.SOURCE] = {
  name : "source",
  parser: (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_03.ID] = {
  name : "id",
  parser : (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_03.TIME] = {
  name : "time",
  parser : (v) => new Date(Date.parse(v))
};
setterByHeader[Constants.BINARY_HEADERS_03.SCHEMA_URL] = {
  name: "schemaurl",
  parser: (v) => v
};
setterByHeader[Constants.HEADER_CONTENT_TYPE] = {
  name: "dataContentType",
  parser: (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_03.CONTENT_ENCONDING] = {
  name: "dataContentEncoding",
  parser: (v) => v
};
setterByHeader[Constants.BINARY_HEADERS_03.SUBJECT] = {
  name: "subject",
  parser: (v) => v
};

function checkDecorator(payload, headers) {
  Object.keys(headers)
    .map((header) => header.toLocaleLowerCase("en-US"))
    .filter((header) =>
              header === Constants.BINARY_HEADERS_03.CONTENT_ENCONDING)
    .filter((header) => !allowedEncodings.includes(headers[header]))
    .forEach((header) => {
      throw {message : "unsupported datacontentencoding", errors: [
        headers[header]
      ]};
    });
}

function Receiver(configuration) {
  this.receiver = new BinaryHTTPReceiver(
    parsersByEncoding,
    setterByHeader,
    allowedContentTypes,
    requiredHeaders,
    Spec,
    Constants.SPEC_V03,
    Constants.BINARY_HEADERS_03.EXTENSIONS_PREFIX,
    checkDecorator
  );
}

Receiver.prototype.check = function(payload, headers) {
  this.receiver.check(payload, headers);
};

Receiver.prototype.parse = function(payload, headers) {
  // firstly specific local checks
  this.check(payload, headers);

  return this.receiver.parse(payload, headers);
};

module.exports = Receiver;
