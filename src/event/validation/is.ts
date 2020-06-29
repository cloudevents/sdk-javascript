const isString = (v: unknown): boolean => typeof v === "string";
const isObject = (v: unknown): boolean => typeof v === "object";
const isDefined = (v: unknown): boolean => v && typeof v !== "undefined";

const isBoolean = (v: unknown): boolean => typeof v === "boolean";
const isInteger = (v: unknown): boolean => Number.isInteger(v as number);
const isDate = (v: unknown): boolean => v instanceof Date;
const isBinary = (v: unknown): boolean => v instanceof Uint32Array;

const isStringOrThrow = (v: unknown, t: Error): boolean =>
  isString(v)
    ? true
    : (() => {
        throw t;
      })();

const isDefinedOrThrow = (v: unknown, t: Error): boolean =>
  isDefined(v)
    ? true
    : (() => {
        throw t;
      })();

const isStringOrObjectOrThrow = (v: unknown, t: Error): boolean =>
  isString(v)
    ? true
    : isObject(v)
    ? true
    : (() => {
        throw t;
      })();

const equalsOrThrow = (v1: unknown, v2: unknown, t: Error): boolean =>
  v1 === v2
    ? true
    : (() => {
        throw t;
      })();

const isBase64 = (value: unknown): boolean => Buffer.from(value as string, "base64").toString("base64") === value;

const isBuffer = (value: unknown): boolean => value instanceof Buffer;

const asBuffer = (value: string | Buffer | Uint32Array): Buffer =>
  isBinary(value)
    ? Buffer.from(value as string)
    : isBuffer(value)
    ? (value as Buffer)
    : (() => {
        throw new TypeError("is not buffer or a valid binary");
      })();

const asBase64 = (value: string | Buffer | Uint32Array): string => asBuffer(value).toString("base64");

const clone = (o: Record<string, unknown>): Record<string, unknown> => JSON.parse(JSON.stringify(o));

const isJsonContentType = (contentType: string) => contentType && contentType.match(/(json)/i);

const asData = (data: unknown, contentType: string): string => {
  // pattern matching alike
  const maybeJson =
    isString(data) && !isBase64(data) && isJsonContentType(contentType) ? JSON.parse(data as string) : data;

  return isBinary(maybeJson) ? asBase64(maybeJson) : maybeJson;
};

const isValidType = (v: boolean | number | string | Date | Uint32Array): boolean =>
  isBoolean(v) || isInteger(v) || isString(v) || isDate(v) || isBinary(v);

export {
  isString,
  isStringOrThrow,
  isObject,
  isDefined,
  isBoolean,
  isInteger,
  isDate,
  isBinary,
  isDefinedOrThrow,
  isStringOrObjectOrThrow,
  isValidType,
  equalsOrThrow,
  isBase64,
  clone,
  asData,
  asBase64,
};
