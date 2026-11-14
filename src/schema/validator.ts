/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { ErrorObject } from "ajv";
import compiled from "./v1";

type SchemaValidator = ((data: unknown) => boolean) & { errors?: ErrorObject[] | null };

// The generated validator sets `errors` at runtime, but its inferred type omits it.
export const validate: SchemaValidator = compiled;
