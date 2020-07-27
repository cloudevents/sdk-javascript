import Ajv from "ajv";
import { ValidationError, isBase64 } from "./validation";

import { CloudEventV1, CloudEventV03 } from "./interfaces";
import { schemaV03, schemaV1 } from "./schemas";
import CONSTANTS from "../constants";

const ajv = new Ajv({ extendRefs: true });
const isValidAgainstSchemaV1 = ajv.compile(schemaV1);
const isValidAgainstSchemaV03 = ajv.compile(schemaV03);

export function validateV1(event: CloudEventV1): boolean {
  if (!isValidAgainstSchemaV1(event)) {
    throw new ValidationError("invalid payload", isValidAgainstSchemaV1.errors);
  }
  return true;
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
