/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

function formats(ajv) {
  require("ajv-formats")(ajv);
}

module.exports = formats;
