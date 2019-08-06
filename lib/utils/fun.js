// Functional approach
const isString = (v) => (typeof v) === "string";
const isObject = (v) => (typeof v) === "object";
const isDefined = (v) => v && (typeof v) != "undefined";

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

module.exports = {
  isString,
  isStringOrThrow,
  isObject,
  isDefined,

  isDefinedOrThrow,
  isStringOrObjectOrThrow,

  equalsOrThrow,
  isBase64,
  clone
};
