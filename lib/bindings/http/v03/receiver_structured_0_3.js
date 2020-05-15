const {
  MIME_JSON,
  MIME_CE_JSON,
  STRUCTURED_ATTRS_03 : {
    TYPE,
    SPEC_VERSION,
    SOURCE,
    ID,
    TIME,
    SCHEMA_URL,
    CONTENT_ENCODING,
    CONTENT_TYPE,
    SUBJECT,
    DATA
  }
} = require("../constants.js");
const Spec = require("./spec_0_3.js");
const JSONParser = require("../../../formats/json/parser.js");

const jsonParserSpec = new JSONParser();
const parserByMime = {
  [MIME_JSON]: jsonParserSpec,
  [MIME_CE_JSON]: jsonParserSpec
};

const allowedContentTypes = [
  MIME_CE_JSON
];

function parser(name, parser = (v) => v) {
  return { name: name, parser: parser};
}
const passThroughParser = parser;

const parserMap = new Map();
parserMap.set(TYPE, passThroughParser("type"));
parserMap.set(SPEC_VERSION, passThroughParser("specversion"));
parserMap.set(SOURCE, passThroughParser("source"));
parserMap.set(ID, passThroughParser("id"));
parserMap.set(TIME, parser("time", (v) => new Date(Date.parse(v))));
parserMap.set(SCHEMA_URL, passThroughParser("schemaurl"));
parserMap.set(CONTENT_ENCODING, passThroughParser("dataContentEncoding"));
parserMap.set(CONTENT_TYPE, passThroughParser("dataContentType"));
parserMap.set(SUBJECT, passThroughParser("subject"));
parserMap.set(DATA, passThroughParser("data"));

class Receiver {
  constructor() {
    this.parserByMime = parserByMime;
    this.parserMap = parserMap;
    this.allowedContentTypes = allowedContentTypes;
    this.Spec = Spec;
    this.spec = new Spec();
  }
}

module.exports = Receiver;
