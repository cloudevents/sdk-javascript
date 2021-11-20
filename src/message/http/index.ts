/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEvent, CloudEventV1, CONSTANTS, Mode, Version } from "../..";
import { Message, Headers } from "..";

import {
  headersFor,
  sanitize,
  v03binaryParsers,
  v03structuredParsers,
  v1binaryParsers,
  v1structuredParsers,
} from "./headers";
import { isStringOrObjectOrThrow, ValidationError } from "../../event/validation";
import { JSONParser, MappedParser, Parser, parserByContentType } from "../../parsers";

/**
 * Serialize a CloudEvent for HTTP transport in binary mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/http-protocol-binding.md#31-binary-content-mode
 *
 * @param {CloudEvent} event The event to serialize
 * @returns {Message} a Message object with headers and body
 */
export function binary<T>(event: CloudEvent<T>): Message {
  const contentType: Headers = { [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CONTENT_TYPE };
  const headers: Headers = { ...contentType, ...headersFor(event) };
  let body = event.data;
  if (typeof event.data === "object" && !(event.data instanceof Uint32Array)) {
    // we'll stringify objects, but not binary data
    body = (JSON.stringify(event.data) as unknown) as T;
  }
  return {
    headers,
    body,
  };
}

/**
 * Serialize a CloudEvent for HTTP transport in structured mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/http-protocol-binding.md#32-structured-content-mode
 *
 * @param {CloudEvent} event the CloudEvent to be serialized
 * @returns {Message} a Message object with headers and body
 */
export function structured<T>(event: CloudEvent<T>): Message {
  if (event.data_base64) {
    // The event's data is binary - delete it
    event = event.cloneWith({ data: undefined });
  }
  return {
    headers: {
      [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
    },
    body: event.toString(),
  };
}

/**
 * Determine if a Message is a CloudEvent
 * @implements {Detector}
 *
 * @param {Message} message an incoming Message object
 * @returns {boolean} true if this Message is a CloudEvent
 */
export function isEvent(message: Message): boolean {
  // TODO: this could probably be optimized
  try {
    deserialize(message);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Converts a Message to a CloudEvent
 * @implements {Deserializer}
 *
 * @param {Message} message the incoming message
 * @return {CloudEvent} A new {CloudEvent} instance
 */
export function deserialize<T>(message: Message): CloudEvent<T> {
  const cleanHeaders: Headers = sanitize(message.headers);
  const mode: Mode = getMode(cleanHeaders);
  const version = getVersion(mode, cleanHeaders, message.body);

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
function getVersion(mode: Mode, headers: Headers, body: string | Record<string, string> | unknown) {
  if (mode === Mode.BINARY) {
    // Check the headers for the version
    const versionHeader = headers[CONSTANTS.CE_HEADERS.SPEC_VERSION];
    if (versionHeader) {
      return versionHeader;
    }
  } else {
    // structured mode - the version is in the body
    if (typeof body === "string") {
      return JSON.parse(body).specversion;
    } else {
      return (body as Record<string, string>).specversion;
    }
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
function parseBinary<T>(message: Message, version: Version): CloudEvent<T> {
  const headers = { ...message.headers };
  let body = message.body;

  if (!headers) throw new ValidationError("headers is null or undefined");

  // Clone and low case all headers names
  const sanitizedHeaders = sanitize(headers);

  const eventObj: { [key: string]: unknown | string | Record<string, unknown> } = {};
  const parserMap: Record<string, MappedParser> = version === Version.V03 ? v03binaryParsers : v1binaryParsers;

  for (const header in parserMap) {
    if (sanitizedHeaders[header]) {
      const mappedParser: MappedParser = parserMap[header];
      eventObj[mappedParser.name] = mappedParser.parser.parse(sanitizedHeaders[header]);
      delete sanitizedHeaders[header];
      delete headers[header];
    }
  }

  // Every unprocessed header can be an extension
  for (const header in headers) {
    if (header.startsWith(CONSTANTS.EXTENSIONS_PREFIX)) {
      eventObj[header.substring(CONSTANTS.EXTENSIONS_PREFIX.length)] = headers[header];
    }
  }

  const parser = parserByContentType[eventObj.datacontenttype as string];
  if (parser && body) {
    body = parser.parse(body as string);
  }

  // At this point, if the datacontenttype is application/json and the datacontentencoding is base64
  // then the data has already been decoded as a string, then parsed as JSON. We don't need to have
  // the datacontentencoding property set - in fact, it's incorrect to do so.
  if (eventObj.datacontenttype === CONSTANTS.MIME_JSON && eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64) {
    delete eventObj.datacontentencoding;
  }

  return new CloudEvent<T>({ ...eventObj, data: body } as CloudEventV1<T>, false);
}

/**
 * Creates a new CloudEvent instance based on the provided payload and headers.
 *
 * @param {Message} message the incoming Message
 * @param {Version} version the spec version of this message (v1 or v03)
 * @returns {CloudEvent} a new CloudEvent instance for the provided headers and payload
 * @throws {ValidationError} if the payload and header combination do not conform to the spec
 */
function parseStructured<T>(message: Message, version: Version): CloudEvent<T> {
  const payload = message.body;
  const headers = message.headers;

  if (!payload) throw new ValidationError("payload is null or undefined");
  if (!headers) throw new ValidationError("headers is null or undefined");
  isStringOrObjectOrThrow(payload, new ValidationError("payload must be an object or a string"));

  // Clone and low case all headers names
  const sanitizedHeaders = sanitize(headers);

  const contentType = sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE];
  const parser: Parser = contentType ? parserByContentType[contentType] : new JSONParser();
  if (!parser) throw new ValidationError(`invalid content type ${sanitizedHeaders[CONSTANTS.HEADER_CONTENT_TYPE]}`);
  const incoming = { ...(parser.parse(payload as string) as Record<string, unknown>) };

  const eventObj: { [key: string]: unknown } = {};
  const parserMap: Record<string, MappedParser> = version === Version.V03 ? v03structuredParsers : v1structuredParsers;

  for (const key in parserMap) {
    const property = incoming[key];
    if (property) {
      const mappedParser: MappedParser = parserMap[key];
      eventObj[mappedParser.name] = mappedParser.parser.parse(property as string);
    }
    delete incoming[key];
  }

  // extensions are what we have left after processing all other properties
  for (const key in incoming) {
    eventObj[key] = incoming[key];
  }

  // data_base64 is a property that only exists on V1 events. For V03 events,
  // there will be a .datacontentencoding property, and the .data property
  // itself will be encoded as base64
  if (eventObj.data_base64 || eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64) {
    const data = eventObj.data_base64 || eventObj.data;
    eventObj.data = new Uint32Array(Buffer.from(data as string, "base64"));
    delete eventObj.data_base64;
    delete eventObj.datacontentencoding;
  }
  return new CloudEvent<T>(eventObj as CloudEventV1<T>, false);
}
