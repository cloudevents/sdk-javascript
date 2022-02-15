/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { ValidationError } from "./validation";

import { CloudEventV1 } from "./interfaces";
import { Version } from "./cloudevent";
import validate from "../schema/v1";


export function validateCloudEvent<T>(event: CloudEventV1<T>): boolean {
  if (event.specversion === Version.V1) {
    if (!validate(event)) {
      throw new ValidationError("invalid payload", (validate as any).errors);
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
