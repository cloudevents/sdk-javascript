import { CloudEvent, CloudEventV03, CloudEventV1, CONSTANTS, Mode, Version } from "../..";
import { Message, Headers } from "..";

import { headersFor, sanitize, v03structuredParsers, v1binaryParsers, v1structuredParsers, validate } from "./headers";
import { asData, isBase64, isString, isStringOrObjectOrThrow, ValidationError } from "../../event/validation";
import { validateCloudEvent } from "../../event/spec";
import { Base64Parser, JSONParser, MappedParser, Parser, parserByContentType } from "../../parsers";

// implements Serializer
export function binary(event: CloudEvent): Message {
  const contentType: Headers = { [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CONTENT_TYPE };
  const headers: Headers = headersFor(event);
  return {
    headers: { ...contentType, ...headers },
    body: asData(event.data, event.datacontenttype as string),
  };
}

// implements Serializer
export function structured(event: CloudEvent): Message {
  return {
    headers: {
      [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
    },
    body: event.toString(),
  };
}

/**
 * Converts a Message to a CloudEvent
 *
 * @param {Message} message the incoming message
 * @return {CloudEvent} A new {CloudEvent} instance
 */
export function deserialize(message: Message): CloudEvent {
  const cleanHeaders: Headers = sanitize(message.headers);
  const mode: Mode = getMode(cleanHeaders);
  let version = getVersion(mode, cleanHeaders, message.body);
  if (version !== Version.V03 && version !== Version.V1) {
    console.error(`Unknown spec version ${version}. Default to ${Version.V1}`);
    version = Version.V1;
  }
  switch (mode) {
    case Mode.BINARY:
      return parseBinary(message, version);
    case Mode.STRUCTURED:
      return parseStructured(message, version);
    default:
      throw new ValidationError("Unknown Message mode");
  }
}

/**
 * Determines the HTTP transport mode (binary or structured) based
 * on the incoming HTTP headers.
 * @param {Headers} headers the incoming HTTP headers
 * @returns {Mode} the transport mode
 */
function getMode(headers: Headers): Mode {
  const contentType = headers[CONSTANTS.HEADER_CONTENT_TYPE];
  if (contentType && contentType.startsWith(CONSTANTS.MIME_CE)) {
    return Mode.STRUCTURED;
  }
  if (headers[CONSTANTS.CE_HEADERS.ID]) {
    return Mode.BINARY;
  }
  throw new ValidationError("no cloud event detected");
}

/**
 * Determines the version of an incoming CloudEvent based on the
 * HTTP headers or HTTP body, depending on transport mode.
 * @param {Mode} mode the HTTP transport mode
 * @param {Headers} headers the incoming HTTP headers
 * @param {Record<string, unknown>} body the HTTP request body
 * @returns {Version} the CloudEvent specification version
 */
function getVersion(mode: Mode, headers: Headers, body: string | Record<string, string>) {
  if (mode === Mode.BINARY) {
    // Check the headers for the version
    const versionHeader = headers[CONSTANTS.CE_HEADERS.SPEC_VERSION];
    if (versionHeader) {
      return versionHeader;
    }
  } else {
    // structured mode - the version is in the body
    return typeof body === "string" ? JSON.parse(body).specversion : (body as CloudEvent).specversion;
  }
  return Version.V1;
}

/**
 * Parses an incoming HTTP Message, converting it to a {CloudEvent}
 * instance if it conforms to the Cloud Event specification for this receiver.
 *
 * @param {Message} message the incoming HTTP Message
 * @param {Version} version the spec version of the incoming event
 * @returns {CloudEvent} an instance of CloudEvent representing the incoming request
 * @throws {ValidationError} of the event does not conform to the spec
 */
function parseBinary(message: Message, version: Version): CloudEvent {
  const headers = message.headers;
  let body = message.body;

  if (!headers) throw new ValidationError("headers is null or undefined");
  if (body) {
    isStringOrObjectOrThrow(body, new ValidationError("payload must be an object or a string"));
  }

  if (
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] &&
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] !== Version.V03 &&
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] !== Version.V1
  ) {
    throw new ValidationError(`invalid spec version ${headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]}`);
  }

  body = isString(body) && isBase64(body) ? Buffer.from(body as string, "base64").toString() : body;

  // Clone and low case all headers names
  const sanitizedHeaders = validate(headers);

  const eventObj: { [key: string]: unknown | string | Record<string, unknown> } = {};
  const parserMap: Record<string, MappedParser> = version === Version.V1 ? v1binaryParsers : v1binaryParsers;

  for (const header in parserMap) {
    if (sanitizedHeaders[header]) {
      const mappedParser: MappedParser = parserMap[header];
      eventObj[mappedParser.name] = mappedParser.parser.parse(sanitizedHeaders[header]);
      delete sanitizedHeaders[header];
    }
  }

  let parsedPayload;

  if (body) {
    const parser = parserByContentType[eventObj.datacontenttype as string];
    if (!parser) {
      throw new ValidationError(`no parser found for content type ${eventObj.datacontenttype}`);
    }
    parsedPayload = parser.parse(body);
  }

  // Every unprocessed header can be an extension
  for (const header in sanitizedHeaders) {
    if (header.startsWith(CONSTANTS.EXTENSIONS_PREFIX)) {
      eventObj[header.substring(CONSTANTS.EXTENSIONS_PREFIX.length)] = headers[header];
    }
  }
  // At this point, if the datacontenttype is application/json and the datacontentencoding is base64
  // then the data has already been decoded as a string, then parsed as JSON. We don't need to have
  // the datacontentencoding property set - in fact, it's incorrect to do so.
  if (eventObj.datacontenttype === CONSTANTS.MIME_JSON && eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64) {
    delete eventObj.datacontentencoding;
  }

  const cloudevent = new CloudEvent({ ...eventObj, data: parsedPayload } as CloudEventV1 | CloudEventV03);
  validateCloudEvent(cloudevent);
  return cloudevent;
}

/**
 * Creates a new CloudEvent instance based on the provided payload and headers.
 *
 * @param {Message} message the incoming Message
 * @param {Version} version the spec version of this message (v1 or v03)
 * @returns {CloudEvent} a new CloudEvent instance for the provided headers and payload
 * @throws {ValidationError} if the payload and header combination do not conform to the spec
 */
function parseStructured(message: Message, version: Version): CloudEvent {
  let payload = message.body;
  const headers = message.headers;

  if (!payload) throw new ValidationError("payload is null or undefined");
  if (!headers) throw new ValidationError("headers is null or undefined");
  isStringOrObjectOrThrow(payload, new ValidationError("payload must be an object or a string"));

  if (
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] &&
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] != Version.V03 &&
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] != Version.V1
  ) {
    throw new ValidationError(`invalid spec version ${headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]}`);
  }

  payload = isString(payload) && isBase64(payload) ? Buffer.from(payload as string, "base64").toString() : payload;

  // Clone and low case all headers names
  const sanitizedHeaders = sanitize(headers);

  const contentType = sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE];
  const parser: Parser = contentType ? parserByContentType[contentType] : new JSONParser();
  if (!parser) throw new ValidationError(`invalid content type ${sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE]}`);
  const incoming = { ...(parser.parse(payload) as Record<string, unknown>) };

  const eventObj: { [key: string]: unknown } = {};
  const parserMap: Record<string, MappedParser> = version === Version.V1 ? v1structuredParsers : v03structuredParsers;

  for (const key in parserMap) {
    const property = incoming[key];
    if (property) {
      const parser: MappedParser = parserMap[key];
      eventObj[parser.name] = parser.parser.parse(property as string);
    }
    delete incoming[key];
  }

  // extensions are what we have left after processing all other properties
  for (const key in incoming) {
    eventObj[key] = incoming[key];
  }

  // ensure data content is correctly encoded
  if (eventObj.data && eventObj.datacontentencoding) {
    if (eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64 && !isBase64(eventObj.data)) {
      throw new ValidationError("invalid payload");
    } else if (eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64) {
      const dataParser = new Base64Parser();
      eventObj.data = JSON.parse(dataParser.parse(eventObj.data as string));
      delete eventObj.datacontentencoding;
    }
  }

  const cloudevent = new CloudEvent(eventObj as CloudEventV1 | CloudEventV03);

  // Validates the event
  validateCloudEvent(cloudevent);
  return cloudevent;
}
