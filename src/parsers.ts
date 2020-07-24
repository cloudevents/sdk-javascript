import CONSTANTS from "./constants";
import { isString, isDefinedOrThrow, isStringOrObjectOrThrow, ValidationError } from "./event/validation";

export abstract class Parser {
  abstract parse(payload: Record<string, unknown> | string): unknown;
}

export class JSONParser implements Parser {
  decorator?: Base64Parser;
  constructor(decorator?: Base64Parser) {
    this.decorator = decorator;
  }

  /**
   * Parses the payload with an optional decorator
   * @param {object|string} payload the JSON payload
   * @return {object} the parsed JSON payload.
   */
  parse(payload: Record<string, unknown> | string): string {
    if (this.decorator) {
      payload = this.decorator.parse(payload);
    }

    isDefinedOrThrow(payload, new ValidationError("null or undefined payload"));
    isStringOrObjectOrThrow(payload, new ValidationError("invalid payload type, allowed are: string or object"));
    const parseJSON = (v: Record<string, unknown> | string): string => (isString(v) ? JSON.parse(v as string) : v);
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

export class DateParser extends Parser {
  parse(payload: string): Date {
    return new Date(Date.parse(payload));
  }
}

export const parserByEncoding: { [key: string]: { [key: string]: Parser } } = {
  base64: {
    [CONSTANTS.MIME_CE_JSON]: new JSONParser(new Base64Parser()),
    [CONSTANTS.MIME_OCTET_STREAM]: new PassThroughParser(),
  },
};
