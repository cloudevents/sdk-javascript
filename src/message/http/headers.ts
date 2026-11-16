/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { PassThroughParser, DateParser, MappedParser } from "../../parsers";
import { CloudEventV1 } from "../..";
import { Headers } from "../";
import { V1 } from "../../event/cloudevent";
import CONSTANTS from "../../constants";
import { asBase64, isBinary, isDate, TypeArray, ValidationError } from "../../event/validation";

export const allowedContentTypes = [CONSTANTS.DEFAULT_CONTENT_TYPE, CONSTANTS.MIME_JSON, CONSTANTS.MIME_OCTET_STREAM];
export const requiredHeaders = [
  CONSTANTS.CE_HEADERS.ID,
  CONSTANTS.CE_HEADERS.SOURCE,
  CONSTANTS.CE_HEADERS.TYPE,
  CONSTANTS.CE_HEADERS.SPEC_VERSION,
];

/**
 * Returns the HTTP headers that will be sent for this event when the HTTP transmission
 * mode is "binary". Events sent over HTTP in structured mode only have a single CE header
 * and that is "ce-id", corresponding to the event ID.
 * @param {CloudEvent} event a CloudEvent
 * @returns {Object} the headers that will be sent for the event
 */
export function headersFor<T>(event: CloudEventV1<T>): Headers {
  const headers: Headers = {};
  let headerMap: Readonly<{ [key: string]: MappedParser }>;
  if (event.specversion === V1) {
    headerMap = v1headerMap;
  } else {
    headerMap = v03headerMap;
  }

  // iterate over the event properties - generate a header for each
  Object.getOwnPropertyNames(event).forEach((property) => {
    const value = event[property];
    if (value !== undefined) {
      const map: MappedParser | undefined = headerMap[property] as MappedParser;
      if (map) {
        headers[map.name] = asCeHeader(map.name, map.parser.parse(value as string));
      } else if (property !== CONSTANTS.DATA_ATTRIBUTE && property !== `${CONSTANTS.DATA_ATTRIBUTE}_base64`) {
        const name = `${CONSTANTS.EXTENSIONS_PREFIX}${property}`;
        headers[name] = asCeHeader(name, stringifyExtensionValue(value));
      }
    }
  });
  // Treat time specially, since it's handled with getters and setters in CloudEvent
  if (event.time) {
    headers[CONSTANTS.CE_HEADERS.TIME] = asCeHeader(
      CONSTANTS.CE_HEADERS.TIME,
      new Date(event.time).toISOString(),
    );
  }
  return headers;
}

/**
 * Percent-encode a `ce-` header value per HTTP Protocol Binding §3.1.3.2.
 *
 * `content-type` is not a `ce-` header (`datacontenttype` maps to it) and is
 * left unchanged, including its spaces. Non-strings stay as they are: boolean
 * and integer extensions are canonicalized by the HTTP client, matching the
 * existing Message shape.
 * @param {string} name the header name
 * @param {unknown} value the header value
 * @return {string} the value to put on the Message
 */
function asCeHeader(name: string, value: unknown): string {
  if (typeof value === "string" && name.toLowerCase().startsWith(CONSTANTS.EXTENSIONS_PREFIX)) {
    return percentEncode(value);
  }
  return value as string;
}

/**
 * Encode one Unicode code point the way §3.1.3.2 requires.
 * Space, `"`, `%`, and code points outside U+0021–U+007E are UTF-8 percent-encoded.
 * Printable ASCII, including `/`, `:`, `+`, `-`, `_`, and `.`, is left as-is.
 * @param {string} value the attribute's canonical string
 * @return {string} the header value
 */
function percentEncode(value: string): string {
  let out = "";
  for (let i = 0; i < value.length;) {
    const cp = value.codePointAt(i) as number;
    i += cp > 0xFFFF ? 2 : 1;
    if (cp === 0x20 || cp === 0x22 || cp === 0x25 || cp < 0x21 || cp > 0x7E) {
      const bytes: number[] = [];
      utf8Bytes(cp, bytes);
      for (let b = 0; b < bytes.length; b++) {
        const hex = bytes[b].toString(16).toUpperCase();
        out += `%${hex.length === 1 ? "0" : ""}${hex}`;
      }
    } else {
      out += String.fromCodePoint(cp);
    }
  }
  return out;
}

function utf8Bytes(codePoint: number, into: number[]): void {
  if (codePoint <= 0x7F) {
    into.push(codePoint);
  } else if (codePoint <= 0x7FF) {
    into.push(0xC0 | (codePoint >> 6), 0x80 | (codePoint & 0x3F));
  } else if (codePoint <= 0xFFFF) {
    into.push(0xE0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3F), 0x80 | (codePoint & 0x3F));
  } else {
    into.push(
      0xF0 | (codePoint >> 18),
      0x80 | ((codePoint >> 12) & 0x3F),
      0x80 | ((codePoint >> 6) & 0x3F),
      0x80 | (codePoint & 0x3F),
    );
  }
}

function isHex(ch: string): boolean {
  return (ch >= "0" && ch <= "9") || (ch >= "A" && ch <= "F") || (ch >= "a" && ch <= "f");
}

function trimOws(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && (value.charAt(start) === " " || value.charAt(start) === "\t")) {
    start++;
  }
  while (end > start && (value.charAt(end - 1) === " " || value.charAt(end - 1) === "\t")) {
    end--;
  }
  return value.slice(start, end);
}

/**
 * Unwrap an RFC 7230 quoted-string, including backslash escapes.
 * A value that is not a single quoted-string is returned unchanged.
 * @param {string} value a header value with OWS already removed
 * @return {string} the unescaped value
 */
function unquoteHeaderValue(value: string): string {
  if (value.length < 2 || value.charAt(0) !== "\"" || value.charAt(value.length - 1) !== "\"") {
    return value;
  }
  let out = "";
  let escaped = false;
  for (let i = 1; i < value.length - 1; i++) {
    const ch = value.charAt(i);
    if (escaped) {
      out += ch;
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === "\"") {
      return value;
    } else {
      out += ch;
    }
  }
  return escaped ? value : out;
}

/**
 * One round of UTF-8 percent-decoding. A `%` not followed by two hex digits
 * stays literal. Ill-formed UTF-8, including overlong sequences, is rejected.
 * @param {string} value the unquoted header value
 * @return {string} the decoded attribute value
 */
function percentDecode(value: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < value.length;) {
    const cp = value.codePointAt(i) as number;
    if (cp === 0x25 && i + 2 < value.length && isHex(value.charAt(i + 1)) && isHex(value.charAt(i + 2))) {
      bytes.push(parseInt(value.slice(i + 1, i + 3), 16));
      i += 3;
      continue;
    }
    utf8Bytes(cp, bytes);
    i += cp > 0xFFFF ? 2 : 1;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`invalid UTF-8 in CloudEvents HTTP header: ${detail}`);
  }
}

function decodeOneCeHeader(value: string): string {
  // §3.1.3.2: trim OWS, unescape a quoted-string, then percent-decode once.
  return percentDecode(unquoteHeaderValue(trimOws(value)));
}

/**
 * Decode a received `ce-` header value per HTTP Protocol Binding §3.1.3.2.
 * @param {string|string[]} value the header value
 * @return {string|string[]} the CloudEvents attribute value
 */
export function decodeCeHeader(value: string | string[]): string | string[] {
  if (Array.isArray(value)) {
    return value.map(decodeOneCeHeader);
  }
  return decodeOneCeHeader(value);
}

/**
 * True for objects created by a literal, `new Object()` or `Object.create(null)`.
 * The check looks at the prototype, so it is not fooled by a shadowed `constructor`
 * property and it does not depend on `Object.prototype.toString`, which a
 * Symbol.toStringTag can spoof. Class instances (Error, Map, Date, ...) are not plain.
 * @param {unknown} value the value to test
 * @returns {boolean} true if the value is a plain object
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    (Object.getPrototypeOf(value) === null && Object.prototype.toString.call(value) === "[object Object]"));

/**
 * Converts an extension attribute value to its binary-mode header value.
 *
 * The CloudEvents type system has no object type: extension values are strings,
 * booleans, integers, binary, URIs or timestamps. Values that are not already
 * strings are converted as follows; the branches are disjoint, so their order
 * does not matter. The last column is what the HTTP client's String() coercion
 * used to put on the wire.
 *
 * | value                    | header value            | before                          |
 * |--------------------------|-------------------------|---------------------------------|
 * | Date                     | RFC 3339 (toISOString)  | local-time string               |
 * | Buffer, typed array      | base64                  | UTF-8 text, or "104,105"        |
 * | plain object, array      | JSON (convenience)      | "[object Object]", or "1,2"     |
 * | anything else            | unchanged               | unchanged                       |
 *
 * JSON for plain objects and arrays is an SDK convenience, not spec behavior;
 * prefer encoding such values as strings yourself. Anything else (Error, Map,
 * null, ...) is not a CloudEvents type and is left for the HTTP client, as before.
 * @param {unknown} value the extension attribute value
 * @returns {string} the header value
 */
function stringifyExtensionValue(value: unknown): string {
  if (isDate(value)) {
    return value.toISOString();
  }
  if (isBinary(value)) {
    return asBase64(value as TypeArray);
  }
  if (isPlainObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return value as string;
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
