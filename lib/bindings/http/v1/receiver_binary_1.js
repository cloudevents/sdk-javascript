const {
  SPEC_V1,
  MIME_JSON,
  MIME_OCTET_STREAM,
  ENCODING_BASE64,
  BINARY_HEADERS_1,
  HEADER_CONTENT_TYPE
} = require("../constants.js");

const Spec = require("./spec_1.js");
const JSONParser = require("../../../formats/json/parser.js");
const Base64Parser = require("../../../formats/base64.js");

const parserByType = {
  [MIME_JSON] : new JSONParser(),
  [MIME_OCTET_STREAM] : { parse(payload) { return payload; } }
};

const parsersByEncoding = {
  null: parserByType,
  undefined: parserByType,
  [ENCODING_BASE64]: {
    [MIME_JSON]: new JSONParser(new Base64Parser()),
    [MIME_OCTET_STREAM]: {
      parse(payload) { return payload; }
    }
  }
};

const allowedContentTypes = [MIME_JSON, MIME_OCTET_STREAM];

const requiredHeaders = [BINARY_HEADERS_1.TYPE, BINARY_HEADERS_1.SPEC_VERSION,
  BINARY_HEADERS_1.SOURCE, BINARY_HEADERS_1.ID];

const passThroughParser = (v) => v;

const setterByHeader = {
  [BINARY_HEADERS_1.TYPE] : { name: "type", parser: passThroughParser },
  [BINARY_HEADERS_1.SPEC_VERSION] : { name: "specversion", parser: () => "1.0" },
  [BINARY_HEADERS_1.SOURCE] : { name: "source", parser: passThroughParser },
  [BINARY_HEADERS_1.ID] : { name: "id", parser: passThroughParser },
  [BINARY_HEADERS_1.TIME] : { name: "time", parser: (v) => new Date(Date.parse(v)) },
  [BINARY_HEADERS_1.DATA_SCHEMA] : { name: "dataSchema", parser: passThroughParser },
  [HEADER_CONTENT_TYPE] : { name: "dataContentType", parser: passThroughParser },
  [BINARY_HEADERS_1.SUBJECT] : { name: "subject", parser: passThroughParser }
};

class Receiver {
  constructor() {
    this.parserByType = parserByType;
    this.parsersByEncoding = parsersByEncoding;
    this.allowedContentTypes = allowedContentTypes;
    this.requiredHeaders = requiredHeaders;
    this.setterByHeader = setterByHeader;
    this.specversion = SPEC_V1;
    this.extensionsPrefix = BINARY_HEADERS_1.EXTENSIONS_PREFIX;
    this.Spec = Spec;
    this.spec = new Spec();
  }
}

module.exports = Receiver;
