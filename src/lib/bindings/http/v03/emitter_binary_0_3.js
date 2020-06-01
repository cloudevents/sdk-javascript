const {
  HEADER_CONTENT_TYPE,
  BINARY_HEADERS_03 : {
   CONTENT_ENCODING,
   SUBJECT,
   TYPE,
   SPEC_VERSION,
   SOURCE,
   ID,
   TIME,
   SCHEMA_URL
  }
} = require("../constants");

function parser(header, parser = (v) => v) {
  return { headerName: header, parse: parser };
}
const passThroughParser = parser;

/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
const headerMap = new Map();
headerMap.set("dataContentType", passThroughParser(HEADER_CONTENT_TYPE));
headerMap.set("dataContentEncoding", passThroughParser(CONTENT_ENCODING));
headerMap.set("subject", passThroughParser(SUBJECT));
headerMap.set("type", passThroughParser(TYPE));
headerMap.set("specversion", passThroughParser(SPEC_VERSION));
headerMap.set("source", passThroughParser(SOURCE));
headerMap.set("id", passThroughParser(ID));
headerMap.set("time", passThroughParser(TIME));
headerMap.set("schemaURL", passThroughParser(SCHEMA_URL));

module.exports = headerMap;
