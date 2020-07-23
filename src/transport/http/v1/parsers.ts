import { PassThroughParser, DateParser, MappedParser } from "../../../parsers";
import CONSTANTS from "../../../constants";

const passThrough = new PassThroughParser();

function parser(name: string, parser = passThrough): MappedParser {
  return { name: name, parser: parser };
}

const binaryParsers: Record<string, MappedParser> = Object.freeze({
  [CONSTANTS.CE_HEADERS.TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.TYPE),
  [CONSTANTS.CE_HEADERS.SPEC_VERSION]: parser(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION),
  [CONSTANTS.CE_HEADERS.SOURCE]: parser(CONSTANTS.CE_ATTRIBUTES.SOURCE),
  [CONSTANTS.CE_HEADERS.ID]: parser(CONSTANTS.CE_ATTRIBUTES.ID),
  [CONSTANTS.CE_HEADERS.TIME]: parser(CONSTANTS.CE_ATTRIBUTES.TIME, new DateParser()),
  [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: parser(CONSTANTS.STRUCTURED_ATTRS_1.DATA_SCHEMA),
  [CONSTANTS.CE_HEADERS.SUBJECT]: parser(CONSTANTS.CE_ATTRIBUTES.SUBJECT),
  [CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE),
  [CONSTANTS.HEADER_CONTENT_TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE),
});

const structuredParsers: Record<string, MappedParser> = Object.freeze({
  [CONSTANTS.CE_ATTRIBUTES.TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION]: parser(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION),
  [CONSTANTS.CE_ATTRIBUTES.SOURCE]: parser(CONSTANTS.CE_ATTRIBUTES.SOURCE),
  [CONSTANTS.CE_ATTRIBUTES.ID]: parser(CONSTANTS.CE_ATTRIBUTES.ID),
  [CONSTANTS.CE_ATTRIBUTES.TIME]: parser(CONSTANTS.CE_ATTRIBUTES.TIME, new DateParser()),
  [CONSTANTS.STRUCTURED_ATTRS_1.DATA_SCHEMA]: parser(CONSTANTS.STRUCTURED_ATTRS_1.DATA_SCHEMA),
  [CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SUBJECT]: parser(CONSTANTS.CE_ATTRIBUTES.SUBJECT),
  [CONSTANTS.CE_ATTRIBUTES.DATA]: parser(CONSTANTS.CE_ATTRIBUTES.DATA),
  [CONSTANTS.STRUCTURED_ATTRS_1.DATA_BASE64]: parser(CONSTANTS.STRUCTURED_ATTRS_1.DATA_BASE64),
});

export { structuredParsers, binaryParsers };
