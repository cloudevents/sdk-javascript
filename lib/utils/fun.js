// Functional approach
const isString = (v) => (typeof v) === "string";
const isObject = (v) => (typeof v) === "object";
const isDefined = (v) => v && (typeof v) != "undefined";

module.exports = {
  isString  : isString,
  isObject  : isObject,
  isDefined : isDefined
};
