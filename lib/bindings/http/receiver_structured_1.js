const {
  MIME_JSON,
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
    DATA_BASE64
  }
} = require("./constants.js");

const Spec = require("../../specs/spec_1.js");
const JSONParser = require("../../formats/json/parser.js");

const StructuredHTTPReceiver = require("./receiver_structured.js");

const jsonParserSpec = new JSONParser();

const parserByMime = {};
parserByMime[MIME_JSON] = jsonParserSpec;
parserByMime[MIME_CE_JSON] = jsonParserSpec;

const allowedContentTypes = [];
allowedContentTypes.push(MIME_CE_JSON);

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
parserMap.set(DATA_SCHEMA, passThroughParser("dataschema"));
parserMap.set(CONTENT_TYPE, passThroughParser("dataContentType"))
parserMap.set(SUBJECT, passThroughParser("subject"));
parserMap.set(DATA, passThroughParser("data"));
parserMap.set(DATA_BASE64, passThroughParser("data"));

// Leaving this in place for now. TODO: fixme
// eslint-disable-next-line
function Receiver(configuration) {
  this.receiver = new StructuredHTTPReceiver(
    parserByMime,
    parserMap,
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
