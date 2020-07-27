import Ajv from "ajv";
import { CloudEventV1 } from "./cloudevent";
import { ValidationError } from "../validation";

import { schemaV1 } from "./schema";

const ajv = new Ajv({ extendRefs: true });
const isValidAgainstSchema = ajv.compile(schemaV1);

export function validateV1(event: CloudEventV1): boolean {
  if (!isValidAgainstSchema(event)) {
    throw new ValidationError("invalid payload", isValidAgainstSchema.errors);
  }
  return true;
}
