import { ValidationError, CloudEvent } from "../..";
import { v03headerMap, v1headerMap } from "./versions";
import { Version } from "../../event/cloudevent";
import { MappedParser } from "../../parsers";
import CONSTANTS from "../../constants";

/**
 * An interface representing HTTP headers as key/value string pairs
 */
export interface Headers {
  [key: string]: string;
}

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
