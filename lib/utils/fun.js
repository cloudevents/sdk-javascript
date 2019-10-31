// Functional approach
const isString = (v) => (typeof v) === "string";
const isObject = (v) => (typeof v) === "object";
const isDefined = (v) => v && (typeof v) != "undefined";

const isBoolean = (v) => (typeof v) === "boolean";
const isInteger = (v) => Number.isInteger(v);
const isDate = (v) => (v instanceof Date);
const isBinary = (v) => (v instanceof ArrayBuffer);

const isStringOrThrow = (v, t) =>
  (isString(v)
    ? true
    : (() => {throw t;})());

const isDefinedOrThrow = (v, t) =>
  (isDefined(v)
    ?  () => true
    : (() => {throw t;})());

const isStringOrObjectOrThrow = (v, t) =>
        (isString(v)
          ? true
          : isObject(v)
            ? true
            : (() => {throw t;})());

const equalsOrThrow = (v1, v2, t) =>
  (v1 === v2
    ? true
    : (() => {throw t;})());

const isBase64 = (value) =>
  Buffer.from(value, "base64").toString("base64") === value;

const clone = (o) =>
  JSON.parse(JSON.stringify(o));

const isJsonContentType = (contentType) =>
  contentType && contentType.match(/(json)/i);

const asData = (data, contentType) =>
  ((typeof data) !== "string"
    ? data
    : isJsonContentType(contentType)
      ? JSON.parse(data)
      : data);

module.exports = {
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

  equalsOrThrow,
  isBase64,
  clone,

  asData
};
