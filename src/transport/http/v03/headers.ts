import { PassThroughParser, MappedParser } from "../../../parsers";
import CONSTANTS from "../../../constants";

const passThrough = new PassThroughParser();
function parser(header: string, parser = passThrough): MappedParser {
  return { name: header, parser };
}

/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
export const headerMap: Readonly<{ [key: string]: MappedParser }> = Object.freeze({
  [CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE]: parser(CONSTANTS.HEADER_CONTENT_TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SUBJECT]: parser(CONSTANTS.CE_HEADERS.SUBJECT),
  [CONSTANTS.CE_ATTRIBUTES.TYPE]: parser(CONSTANTS.CE_HEADERS.TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION]: parser(CONSTANTS.CE_HEADERS.SPEC_VERSION),
  [CONSTANTS.CE_ATTRIBUTES.SOURCE]: parser(CONSTANTS.CE_HEADERS.SOURCE),
  [CONSTANTS.CE_ATTRIBUTES.ID]: parser(CONSTANTS.CE_HEADERS.ID),
  [CONSTANTS.CE_ATTRIBUTES.TIME]: parser(CONSTANTS.CE_HEADERS.TIME),
  [CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING]: parser(CONSTANTS.BINARY_HEADERS_03.CONTENT_ENCODING),
  [CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL]: parser(CONSTANTS.BINARY_HEADERS_03.SCHEMA_URL),
});
