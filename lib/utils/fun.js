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

module.exports = {
  isString,
  isStringOrThrow,
  isObject,
  isDefined,

  isDefinedOrThrow,
  isStringOrObjectOrThrow,

  equalsOrThrow
};
