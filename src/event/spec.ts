import Ajv from "ajv";
import { v4 as uuidv4 } from "uuid";
import { ValidationError, isBase64 } from "./validation";

import { CloudEvent } from "./cloudevent";
import { CloudEventV1, CloudEventV1Attributes, CloudEventV03, CloudEventV03Attributes } from "./interfaces";
import { schemaV03, schemaV1 } from "./schemas";
import CONSTANTS from "../constants";

const ajv = new Ajv({ extendRefs: true });
const isValidAgainstSchemaV1 = ajv.compile(schemaV1);
const isValidAgainstSchemaV03 = ajv.compile(schemaV03);

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
  if (!isValidAgainstSchemaV1(event)) {
    throw new ValidationError("invalid payload", isValidAgainstSchemaV1.errors);
  }
  return true;
}

export function createV03(attributes: CloudEventV03Attributes): CloudEventV03 {
  const event: CloudEventV03 = {
    specversion: schemaV03.definitions.specversion.const,
    id: uuidv4(),
    time: new Date().toISOString(),
    ...attributes,
  };
  return new CloudEvent(event);
}

export function validateV03(event: CloudEventV03): boolean {
  if (!isValidAgainstSchemaV03(event)) {
    throw new ValidationError("invalid payload", isValidAgainstSchemaV03.errors);
  }
  return checkDataContentEncoding(event);
}

function checkDataContentEncoding(event: CloudEventV03): boolean {
  if (event.datacontentencoding) {
    // we only support base64
    const encoding = event.datacontentencoding.toLocaleLowerCase();
    if (encoding !== CONSTANTS.ENCODING_BASE64) {
      throw new ValidationError("invalid payload", [`Unsupported content encoding: ${encoding}`]);
    } else {
      if (!isBase64(event.data)) {
        throw new ValidationError("invalid payload", [`Invalid content encoding of data: ${event.data}`]);
      }
    }
  }
  return true;
}
