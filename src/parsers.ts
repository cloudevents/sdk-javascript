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
   * Parses the payload with an optional decorator
   * @param {object|string} payload the JSON payload
   * @return {unknown} the parsed JSON payload.
   */
  parse(payload: Record<string, unknown> | string): unknown {
    if (typeof payload === "string") {
      // This is kind of a hack, but the payload data could be JSON in the form of a single
      // string, such as "some data". But without the quotes in the string, JSON.parse blows
      // up. We can check for this scenario and add quotes. Not sure if this is ideal.
      if (!/^[[|{|"]/.test(payload)) {
        payload = `"${payload}"`;
      }
    }
    if (this.decorator) {
      payload = this.decorator.parse(payload);
    }

    isDefinedOrThrow(payload, new ValidationError("null or undefined payload"));
    isStringOrObjectOrThrow(payload, new ValidationError("invalid payload type, allowed are: string or object"));

    if (process.env[CONSTANTS.USE_BIG_INT_ENV] === "true") {
      JSON = JSONbig(({ useNativeBigInt: true })) as JSON;
    } else {
      JSON = __JSON;
    }

    const parseJSON = (v: Record<string, unknown> | string): unknown => (isString(v) ? JSON.parse(v as string) : v);
    return parseJSON(payload);
  }
}

export class PassThroughParser extends Parser {
  parse(payload: unknown): unknown {
    return payload;
  }
}

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

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// RFC 3339 section 5.6 date-time. T/t and Z/z are accepted; numeric offsets
// require a colon. Date.parse is not the validator: it accepts date-only values
// and zone-less local times, and a failed parse must not become "now".
const RFC3339_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|([+-])(\d{2}):(\d{2}))$/;

const INVALID_TIME = "invalid time, must be RFC 3339";

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isRfc3339DateTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const match = RFC3339_DATE_TIME.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return false;
  }
  if (match[9] !== undefined) {
    const offsetHour = Number(match[10]);
    const offsetMinute = Number(match[11]);
    if (offsetHour > 23 || offsetMinute > 59) {
      return false;
    }
  }
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month];
  return day >= 1 && day <= maxDay;
}

export class DateParser extends Parser {
  parse(payload: string): string {
    if (!isRfc3339DateTime(payload)) {
      throw new ValidationError(INVALID_TIME);
    }
    const date = new Date(payload);
    if (Number.isNaN(date.getTime())) {
      throw new ValidationError(INVALID_TIME);
    }
    return date.toISOString();
  }
}

export const parserByEncoding: { [key: string]: { [key: string]: Parser } } = {
  base64: {
    [CONSTANTS.MIME_CE_JSON]: new JSONParser(new Base64Parser()),
    [CONSTANTS.MIME_OCTET_STREAM]: new PassThroughParser(),
  },
};
