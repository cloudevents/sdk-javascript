import { PassThroughParser, DateParser, MappedParser } from "../../parsers";
import { ValidationError, CloudEvent } from "../..";
import { Headers } from "../";
import { Version } from "../../event/cloudevent";
import CONSTANTS from "../../constants";

export const allowedContentTypes = [CONSTANTS.DEFAULT_CONTENT_TYPE, CONSTANTS.MIME_JSON, CONSTANTS.MIME_OCTET_STREAM];
export const requiredHeaders = [
  CONSTANTS.CE_HEADERS.ID,
  CONSTANTS.CE_HEADERS.SOURCE,
  CONSTANTS.CE_HEADERS.TYPE,
  CONSTANTS.CE_HEADERS.SPEC_VERSION,
];

/**
 * Validates cloud event headers and their values
 * @param {Headers} headers event transport headers for validation
 * @throws {ValidationError} if the headers are invalid
 * @return {boolean} true if headers are valid
 */
export function validate(headers: Headers): Headers {
  const sanitizedHeaders = sanitize(headers);

  // if content-type exists, be sure it's an allowed type
  const contentTypeHeader = sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE];
  const noContentType = !allowedContentTypes.includes(contentTypeHeader);
  if (contentTypeHeader && noContentType) {
    throw new ValidationError("invalid content type", [sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE]]);
  }

  requiredHeaders
    .filter((required: string) => !sanitizedHeaders[required])
    .forEach((required: string) => {
      throw new ValidationError(`header '${required}' not found`);
    });

  if (!sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE]) {
    sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE] = CONSTANTS.MIME_JSON;
  }

  return sanitizedHeaders;
}

/**
 * Returns the HTTP headers that will be sent for this event when the HTTP transmission
 * mode is "binary". Events sent over HTTP in structured mode only have a single CE header
 * and that is "ce-id", corresponding to the event ID.
 * @param {CloudEvent} event a CloudEvent
 * @returns {Object} the headers that will be sent for the event
 */
export function headersFor(event: CloudEvent): Headers {
  const headers: Headers = {};
  let headerMap: Readonly<{ [key: string]: MappedParser }>;
  if (event.specversion === Version.V1) {
    headerMap = v1headerMap;
  } else {
    headerMap = v03headerMap;
  }

  // iterate over the event properties - generate a header for each
  Object.getOwnPropertyNames(event).forEach((property) => {
    const value = event[property];
    if (value) {
      const map: MappedParser | undefined = headerMap[property] as MappedParser;
      if (map) {
        headers[map.name] = map.parser.parse(value as string) as string;
      } else if (property !== CONSTANTS.DATA_ATTRIBUTE && property !== `${CONSTANTS.DATA_ATTRIBUTE}_base64`) {
        headers[`${CONSTANTS.EXTENSIONS_PREFIX}${property}`] = value as string;
      }
    }
  });
  // Treat time specially, since it's handled with getters and setters in CloudEvent
  if (event.time) {
    headers[CONSTANTS.CE_HEADERS.TIME] = event.time as string;
  }
  return headers;
}

/**
 * Sanitizes incoming headers by lowercasing them and potentially removing
 * encoding from the content-type header.
 * @param {Headers} headers HTTP headers as key/value pairs
 * @returns {Headers} the sanitized headers
 */
export function sanitize(headers: Headers): Headers {
  const sanitized: Headers = {};

  Array.from(Object.keys(headers))
    .filter((header) => Object.hasOwnProperty.call(headers, header))
    .forEach((header) => (sanitized[header.toLowerCase()] = headers[header]));

  return sanitized;
}

function parser(name: string, parser = new PassThroughParser()): MappedParser {
  return { name: name, parser: parser };
}

/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
export const v1headerMap: Readonly<{ [key: string]: MappedParser }> = Object.freeze({
  [CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE]: parser(CONSTANTS.HEADER_CONTENT_TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SUBJECT]: parser(CONSTANTS.CE_HEADERS.SUBJECT),
  [CONSTANTS.CE_ATTRIBUTES.TYPE]: parser(CONSTANTS.CE_HEADERS.TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION]: parser(CONSTANTS.CE_HEADERS.SPEC_VERSION),
  [CONSTANTS.CE_ATTRIBUTES.SOURCE]: parser(CONSTANTS.CE_HEADERS.SOURCE),
  [CONSTANTS.CE_ATTRIBUTES.ID]: parser(CONSTANTS.CE_HEADERS.ID),
  [CONSTANTS.CE_ATTRIBUTES.TIME]: parser(CONSTANTS.CE_HEADERS.TIME),
  [CONSTANTS.STRUCTURED_ATTRS_1.DATA_SCHEMA]: parser(CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA),
});

export const v1binaryParsers: Record<string, MappedParser> = Object.freeze({
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

export const v1structuredParsers: Record<string, MappedParser> = Object.freeze({
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

/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
export const v03headerMap: Readonly<{ [key: string]: MappedParser }> = Object.freeze({
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

export const v03binaryParsers: Record<string, MappedParser> = Object.freeze({
  [CONSTANTS.CE_HEADERS.TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.TYPE),
  [CONSTANTS.CE_HEADERS.SPEC_VERSION]: parser(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION),
  [CONSTANTS.CE_HEADERS.SOURCE]: parser(CONSTANTS.CE_ATTRIBUTES.SOURCE),
  [CONSTANTS.CE_HEADERS.ID]: parser(CONSTANTS.CE_ATTRIBUTES.ID),
  [CONSTANTS.CE_HEADERS.TIME]: parser(CONSTANTS.CE_ATTRIBUTES.TIME, new DateParser()),
  [CONSTANTS.BINARY_HEADERS_03.SCHEMA_URL]: parser(CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL),
  [CONSTANTS.CE_HEADERS.SUBJECT]: parser(CONSTANTS.CE_ATTRIBUTES.SUBJECT),
  [CONSTANTS.BINARY_HEADERS_03.CONTENT_ENCODING]: parser(CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING),
  [CONSTANTS.HEADER_CONTENT_TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE),
});

export const v03structuredParsers: Record<string, MappedParser> = Object.freeze({
  [CONSTANTS.CE_ATTRIBUTES.TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION]: parser(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION),
  [CONSTANTS.CE_ATTRIBUTES.SOURCE]: parser(CONSTANTS.CE_ATTRIBUTES.SOURCE),
  [CONSTANTS.CE_ATTRIBUTES.ID]: parser(CONSTANTS.CE_ATTRIBUTES.ID),
  [CONSTANTS.CE_ATTRIBUTES.TIME]: parser(CONSTANTS.CE_ATTRIBUTES.TIME, new DateParser()),
  [CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL]: parser(CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL),
  [CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING]: parser(CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING),
  [CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE]: parser(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE),
  [CONSTANTS.CE_ATTRIBUTES.SUBJECT]: parser(CONSTANTS.CE_ATTRIBUTES.SUBJECT),
  [CONSTANTS.CE_ATTRIBUTES.DATA]: parser(CONSTANTS.CE_ATTRIBUTES.DATA),
});
