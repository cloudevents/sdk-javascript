const {
  MIME_CE_JSON,
  STRUCTURED_ATTRS_1 : {
    TYPE,
    SPEC_VERSION,
    SOURCE,
    ID,
    TIME,
    DATA_SCHEMA,
    CONTENT_TYPE,
    SUBJECT,
    DATA,
    DATA_BASE64,
    MIME_JSON
  }
} = require("../constants");

const Spec = require("./spec_1.js");
const JSONParser = require("../../../formats/json/parser.js");

const jsonParser = new JSONParser();

const parserByMime = {
  [MIME_JSON]: jsonParser,
  [MIME_CE_JSON]: jsonParser
};

const allowedContentTypes = [ MIME_CE_JSON ];

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
parserMap.set(DATA_SCHEMA, passThroughParser("dataSchema"));
parserMap.set(CONTENT_TYPE, passThroughParser("dataContentType"));
parserMap.set(SUBJECT, passThroughParser("subject"));
parserMap.set(DATA, passThroughParser("data"));
parserMap.set(DATA_BASE64, passThroughParser("data"));

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
