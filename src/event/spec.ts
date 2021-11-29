/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import Ajv, { Options } from "ajv";
import { ValidationError } from "./validation";

import { CloudEventV1 } from "./interfaces";
import { schemaV1 } from "./schemas";
import { Version } from "./cloudevent";

const ajv = new Ajv({ extendRefs: true } as Options);

// handle date-time format specially because a user could pass
// Date().toString(), which is not spec compliant date-time format
ajv.addFormat("js-date-time", function (dateTimeString) {
  const date = new Date(Date.parse(dateTimeString));
  return date.toString() !== "Invalid Date";
});

const isValidAgainstSchemaV1 = ajv.compile(schemaV1);

export function validateCloudEvent<T>(event: CloudEventV1<T>): boolean {
  if (event.specversion === Version.V1) {
    if (!isValidAgainstSchemaV1(event)) {
      throw new ValidationError("invalid payload", isValidAgainstSchemaV1.errors);
    }
  } else {
    return false;
  }
  // attribute names must all be lowercase
  for (const key in event) {
    if (key !== key.toLowerCase()) {
      throw new ValidationError(`invalid attribute name: ${key}`);
    }
  }
  return true;
}
