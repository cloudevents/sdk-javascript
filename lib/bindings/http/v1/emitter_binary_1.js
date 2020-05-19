const {
  HEADER_CONTENT_TYPE,
  BINARY_HEADERS_1 : {
   SUBJECT,
   TYPE,
   SPEC_VERSION,
   SOURCE,
   ID,
   TIME,
   DATA_SCHEMA
 }
} = require("../constants.js");

function parser(header, parser = v => v) {
  return { headerName: header, parse: parser };
}
const passThroughParser = parser;

/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
const headerMap = new Map();
headerMap.set('getDataContentType', passThroughParser(HEADER_CONTENT_TYPE));
headerMap.set('getSubject', passThroughParser(SUBJECT));
headerMap.set('getType', passThroughParser(TYPE));
headerMap.set('getSpecversion', passThroughParser(SPEC_VERSION));
headerMap.set('getSource', passThroughParser(SOURCE));
headerMap.set('getId', passThroughParser(ID));
headerMap.set('getTime', passThroughParser(TIME));
headerMap.set('getDataschema', passThroughParser(DATA_SCHEMA));

module.exports = headerMap;
