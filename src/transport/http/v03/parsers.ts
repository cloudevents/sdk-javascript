import { MappedParser, DateParser, PassThroughParser } from "../../../parsers";
import CONSTANTS from "../../../constants";

const passThrough = new PassThroughParser();
function parser(name: string, parser = passThrough): MappedParser {
  return { name: name, parser: parser };
}

const binaryParsers: Map<string, MappedParser> = new Map();
binaryParsers.set(CONSTANTS.CE_HEADERS.TYPE, parser(CONSTANTS.CE_ATTRIBUTES.TYPE));
binaryParsers.set(CONSTANTS.CE_HEADERS.SPEC_VERSION, parser(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION));
binaryParsers.set(CONSTANTS.CE_HEADERS.SOURCE, parser(CONSTANTS.CE_ATTRIBUTES.SOURCE));
binaryParsers.set(CONSTANTS.CE_HEADERS.ID, parser(CONSTANTS.CE_ATTRIBUTES.ID));
binaryParsers.set(CONSTANTS.CE_HEADERS.TIME, parser(CONSTANTS.CE_ATTRIBUTES.TIME, new DateParser()));
binaryParsers.set(CONSTANTS.BINARY_HEADERS_03.SCHEMA_URL, parser(CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL));
binaryParsers.set(CONSTANTS.CE_HEADERS.SUBJECT, parser(CONSTANTS.CE_ATTRIBUTES.SUBJECT));
binaryParsers.set(CONSTANTS.BINARY_HEADERS_03.CONTENT_ENCODING, parser(CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING));
binaryParsers.set(CONSTANTS.HEADER_CONTENT_TYPE, parser(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE));

const structuredParsers: Map<string, MappedParser> = new Map();
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.TYPE, parser(CONSTANTS.CE_ATTRIBUTES.TYPE));
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION, parser(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION));
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.SOURCE, parser(CONSTANTS.CE_ATTRIBUTES.SOURCE));
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.ID, parser(CONSTANTS.CE_ATTRIBUTES.ID));
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.TIME, parser(CONSTANTS.CE_ATTRIBUTES.TIME, new DateParser()));
structuredParsers.set(CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL, parser(CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL));
structuredParsers.set(
  CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING,
  parser(CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING),
);
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE, parser(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE));
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.SUBJECT, parser(CONSTANTS.CE_ATTRIBUTES.SUBJECT));
structuredParsers.set(CONSTANTS.CE_ATTRIBUTES.DATA, parser(CONSTANTS.CE_ATTRIBUTES.DATA));

export { binaryParsers, structuredParsers };
