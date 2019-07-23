// Functional approach
const isString = (v) => (typeof v) === "string";
const isObject = (v) => (typeof v) === "object";
const isDefined = (v) => v && (typeof v) != "undefined";

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

module.exports = {
  isString  : isString,
  isObject  : isObject,
  isDefined : isDefined,

  isDefinedOrThrow : isDefinedOrThrow,
  isStringOrObjectOrThrow : isStringOrObjectOrThrow
};
