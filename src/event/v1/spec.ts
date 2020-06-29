import Ajv from "ajv";
import { v4 as uuidv4 } from "uuid";

import { CloudEvent } from "../cloudevent";
import { CloudEventV1, CloudEventV1Attributes } from "./cloudevent";
import { ValidationError } from "../validation";

import { schemaV1 } from "./schema";

const ajv = new Ajv({ extendRefs: true });
const isValidAgainstSchema = ajv.compile(schemaV1);

export function createV1(attributes: CloudEventV1Attributes): CloudEventV1 {
  const event: CloudEventV1 = {
    specversion: schemaV1.definitions.specversion.const,
    id: uuidv4(),
    time: new Date().toISOString(),
    ...attributes,
  };
  return new CloudEvent(event);
}

export function validateV1(event: CloudEventV1): boolean {
  if (!isValidAgainstSchema(event)) {
    throw new ValidationError("invalid payload", isValidAgainstSchema.errors);
  }
  return true;
}
