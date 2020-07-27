import Ajv from "ajv";
import { ValidationError, isBase64 } from "../validation";
import { CloudEventV03 } from "./cloudevent";
import { schema } from "./schema";
import CONSTANTS from "../../constants";

const ajv = new Ajv({ extendRefs: true });
const isValidAgainstSchema = ajv.compile(schema);

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
