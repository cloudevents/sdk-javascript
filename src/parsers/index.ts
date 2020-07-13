import { Parser } from "./parser";
import { JSONParser } from "./json";
import { PassThroughParser } from "./pass_through";
import { Base64Parser } from "./base64";
import CONSTANTS from "../constants";

export * from "./parser";
export * from "./base64";
export * from "./json";
export * from "./date";
export * from "./mapped";
export * from "./pass_through";

const jsonParser = new JSONParser();
const passThroughParser = new PassThroughParser();

export const parserByContentType: { [key: string]: Parser } = {
  [CONSTANTS.MIME_JSON]: jsonParser,
  [CONSTANTS.MIME_CE_JSON]: jsonParser,
  [CONSTANTS.DEFAULT_CONTENT_TYPE]: jsonParser,
  [CONSTANTS.DEFAULT_CE_CONTENT_TYPE]: jsonParser,
  [CONSTANTS.MIME_OCTET_STREAM]: passThroughParser,
};

export const parserByEncoding: { [key: string]: { [key: string]: Parser } } = {
  base64: {
    [CONSTANTS.MIME_CE_JSON]: new JSONParser(new Base64Parser()),
    [CONSTANTS.MIME_OCTET_STREAM]: new PassThroughParser(),
  },
};
