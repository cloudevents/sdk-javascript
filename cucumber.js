/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

// cucumber.js
let common = [
  "--require-module ts-node/register", // Load TypeScript module
  "--require test/conformance/steps.ts", // Load step definitions
].join(" ");

module.exports = {
  default: common,
};
