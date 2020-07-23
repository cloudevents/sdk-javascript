// cucumber.js
let common = [
  "--require-module ts-node/register", // Load TypeScript module
  "--require test/conformance/steps.ts", // Load step definitions
  "--format progress-bar", // Load custom formatter
  "--format node_modules/cucumber-pretty", // Load custom formatter
].join(" ");

module.exports = {
  default: common,
};
