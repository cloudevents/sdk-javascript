const {
  SPEC_V03,
  MIME_JSON,
  MIME_OCTET_STREAM,
  ENCODING_BASE64,
  HEADER_CONTENT_TYPE,
  BINARY_HEADERS_03
} = require("../constants.js");
const Spec = require("./spec_0_3.js");

const JSONParser = require("../../../formats/json/parser.js");
const Base64Parser = require("../../../formats/base64.js");

const parserByType = {
  [MIME_JSON]: new JSONParser(),
  [MIME_OCTET_STREAM]: {
    parse(payload) { return payload; }
  }
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

const allowedContentTypes = [
  MIME_JSON, MIME_OCTET_STREAM
];

const requiredHeaders = [
  BINARY_HEADERS_03.TYPE,
  BINARY_HEADERS_03.SPEC_VERSION,
  BINARY_HEADERS_03.SOURCE,
  BINARY_HEADERS_03.ID
];

const passThroughParser = (v) => v;

const setterByHeader = {
  [BINARY_HEADERS_03.TYPE] : { name: "type", parser: passThroughParser },
  [BINARY_HEADERS_03.SPEC_VERSION] : { name: "specversion", parser: () => "0.3" },
  [BINARY_HEADERS_03.SOURCE] : { name: "source", parser: passThroughParser },
  [BINARY_HEADERS_03.ID] : { name: "id", parser: passThroughParser },
  [BINARY_HEADERS_03.TIME] : { name: "time", parser: (v) => new Date(Date.parse(v)) },
  [BINARY_HEADERS_03.SCHEMA_URL] : { name: "schemaurl", parser: passThroughParser },
  [HEADER_CONTENT_TYPE]: { name: "dataContentType", parser: passThroughParser },
  [BINARY_HEADERS_03.CONTENT_ENCONDING]: { name: "dataContentEncoding", parser: passThroughParser },
  [BINARY_HEADERS_03.SUBJECT] : { name: "subject", parser: passThroughParser }
};

class Receiver {
  constructor() {
    this.parsersByEncoding = parsersByEncoding;
    this.setterByHeader = setterByHeader;
    this.allowedContentTypes = allowedContentTypes;
    this.requiredHeaders = requiredHeaders;
    this.extensionsPrefix = BINARY_HEADERS_03.EXTENSIONS_PREFIX;
    this.specversion = SPEC_V03;
    this.Spec = Spec;
    this.spec = new Spec();
  }
}

module.exports = Receiver;
