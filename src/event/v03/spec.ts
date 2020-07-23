import { v4 as uuidv4 } from "uuid";
import Ajv from "ajv";
import { ValidationError, isBase64 } from "../validation";
import { CloudEventV03, CloudEventV03Attributes } from "./cloudevent";
import { CloudEvent } from "../..";
import { schema } from "./schema";
import CONSTANTS from "../../constants";

const ajv = new Ajv({ extendRefs: true });
const isValidAgainstSchema = ajv.compile(schema);

export function createV03(attributes: CloudEventV03Attributes): CloudEventV03 {
  const event: CloudEventV03 = {
    specversion: schema.definitions.specversion.const,
    id: uuidv4(),
    time: new Date().toISOString(),
    ...attributes,
  };
  return new CloudEvent(event);
}

export function validateV03(event: CloudEventV03): boolean {
  if (!isValidAgainstSchema(event)) {
    throw new ValidationError("invalid payload", isValidAgainstSchema.errors);
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
