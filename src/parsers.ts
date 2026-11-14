/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import JSONbig from "json-bigint";
import CONSTANTS from "./constants";
import { isString, isDefinedOrThrow, isStringOrObjectOrThrow, ValidationError } from "./event/validation";

const __JSON = JSON;
export abstract class Parser {
  abstract parse(payload: Record<string, unknown> | string | string[] | undefined): unknown;
}

export class JSONParser implements Parser {
  decorator?: Base64Parser;
  constructor(decorator?: Base64Parser) {
    this.decorator = decorator;
  }

  /**
   * Parses the payload with an optional decorator.
   *
   * Valid JSON text is parsed as JSON, including primitives (`0`, `false`,
   * `null`, numbers, and quoted strings). A raw string that is not JSON text
   * and does not look like a JSON value (for example `I am a string!`) is
   * still accepted as a JSON string.
   * @param {object|string} payload the JSON payload
   * @return {unknown} the parsed JSON payload.
   */
  parse(payload: Record<string, unknown> | string): unknown {
    let value: unknown = payload;
    // Decorator order matches the historical base64 path: quote a non-JSON
    // string first, then let the decorator decode, then parse.
    if (this.decorator && typeof value === "string" && !JSON_TEXT_START.test(value)) {
      value = `"${value}"`;
    }
    if (this.decorator) {
      value = this.decorator.parse(value as Record<string, unknown> | string);
    }

    isDefinedOrThrow(value, new ValidationError("null or undefined payload"));
    isStringOrObjectOrThrow(value, new ValidationError("invalid payload type, allowed are: string or object"));

    if (process.env[CONSTANTS.USE_BIG_INT_ENV] === "true") {
      JSON = JSONbig(({ useNativeBigInt: true })) as JSON;
    } else {
      JSON = __JSON;
    }

    if (!isString(value)) {
      return value;
    }

    const text = value as string;
    try {
      return JSON.parse(text);
    } catch (err) {
      // Legacy callers pass unquoted application strings. Structured JSON that
      // fails to parse (`{gg`) still throws.
      if (!this.decorator && !JSON_TEXT_START.test(text)) {
        return JSON.parse(`"${text}"`);
      }
      throw err;
    }
  }
}

export class PassThroughParser extends Parser {
  parse(payload: unknown): unknown {
    return payload;
  }
}

/**
 * True when `payload` starts like JSON text that must not be auto-quoted.
 * The character class is historical: `[`, `{`, `"`, and a literal `|`.
 */
const JSON_TEXT_START = /^[[{|"]/;

const jsonParser = new JSONParser();
export const parserByContentType: { [key: string]: Parser } = {
  [CONSTANTS.MIME_JSON]: jsonParser,
  [CONSTANTS.MIME_CE_JSON]: jsonParser,
  [CONSTANTS.DEFAULT_CONTENT_TYPE]: jsonParser,
  [CONSTANTS.DEFAULT_CE_CONTENT_TYPE]: jsonParser,
  [CONSTANTS.MIME_OCTET_STREAM]: new PassThroughParser(),
};

export class Base64Parser implements Parser {
  decorator?: Parser;

  constructor(decorator?: Parser) {
    this.decorator = decorator;
  }

  parse(payload: Record<string, unknown> | string): string {
    let payloadToParse = payload;
    if (this.decorator) {
      payloadToParse = this.decorator.parse(payload) as string;
    }

    return Buffer.from(payloadToParse as string, "base64").toString();
  }
}

export interface MappedParser {
  name: string;
  parser: Parser;
}

export class DateParser extends Parser {
  parse(payload: string): string {
    let date = new Date(Date.parse(payload));
    if (date.toString() === "Invalid Date") {
      date = new Date();
    }
    return date.toISOString();
  }
}

/**
 * RFC 9110 media-type essence: `type/subtype`, without parameters, lowercased.
 * `application/cloudevents+json; charset=UTF-8` becomes `application/cloudevents+json`.
 * @param {string} contentType a Content-Type header value
 * @return {string} the normalized media type, or an empty string
 */
export function contentTypeEssence(contentType: string): string {
  const semi = contentType.indexOf(";");
  const type = semi === -1 ? contentType : contentType.slice(0, semi);
  return type.trim().toLowerCase();
}

/**
 * True for `type/json` and structured-syntax `type/subtype+json` media types.
 * @param {string} essence a normalized media type
 * @return {boolean} true when the media type is JSON or a +json suffix
 */
function isJsonEssence(essence: string): boolean {
  const slash = essence.indexOf("/");
  if (slash <= 0 || slash === essence.length - 1) {
    return false;
  }
  const subtype = essence.slice(slash + 1);
  return subtype === "json" || subtype.endsWith("+json");
}

/**
 * Resolves a parser for an HTTP Content-Type.
 *
 * Lookup normalizes the media type (case, surrounding whitespace, parameters).
 * An entry in {@link parserByContentType} always wins, including a custom
 * parser registered for a `+json` type. Unregistered `+json` and `json`
 * media types use the JSON parser.
 * @param {string} contentType a Content-Type header value
 * @return {Parser|undefined} the parser, or undefined when none applies
 */
export function parserForContentType(contentType: string | undefined): Parser | undefined {
  if (!contentType) {
    return undefined;
  }
  const direct = parserByContentType[contentType];
  if (direct) {
    return direct;
  }
  const essence = contentTypeEssence(contentType);
  if (!essence) {
    return undefined;
  }
  const byEssence = parserByContentType[essence];
  if (byEssence) {
    return byEssence;
  }
  const keys = Object.keys(parserByContentType);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (contentTypeEssence(key) === essence) {
      return parserByContentType[key];
    }
  }
  if (isJsonEssence(essence)) {
    return jsonParser;
  }
  return undefined;
}

export const parserByEncoding: { [key: string]: { [key: string]: Parser } } = {
  base64: {
    [CONSTANTS.MIME_CE_JSON]: new JSONParser(new Base64Parser()),
    [CONSTANTS.MIME_OCTET_STREAM]: new PassThroughParser(),
  },
};
