import { CloudEvent, Version } from "../..";
import { CloudEventV1, CloudEventV03 } from "../../event/interfaces";
import { validateV1, validateV03 } from "../../event/spec";
import { Headers, validate } from "./headers";
import { v03binaryParsers, v1binaryParsers } from "./versions";
import { parserByContentType, MappedParser } from "../../parsers";
import { isString, isBase64, ValidationError, isStringOrObjectOrThrow } from "../../event/validation";
import CONSTANTS from "../../constants";

/**
 * A class that receives binary CloudEvents over HTTP. This class can be used
 * if you know that all incoming events will be using binary transport. If
 * events can come as either binary or structured, use {HTTPReceiver}.
 */
export class BinaryHTTPReceiver {
  /**
   * The specification version of the incoming cloud event
   */
  version: Version;
  constructor(version: Version = Version.V1) {
    this.version = version;
  }

  /**
   * Parses an incoming HTTP request, converting it to a {CloudEvent}
   * instance if it conforms to the Cloud Event specification for this receiver.
   *
   * @param {Object|string} payload the HTTP request body
   * @param {Object} headers the HTTP request headers
   * @param {Version} version the spec version of the incoming event
   * @returns {CloudEvent} an instance of CloudEvent representing the incoming request
   * @throws {ValidationError} of the event does not conform to the spec
   */
  parse(payload: string | Record<string, unknown> | undefined | null, headers: Headers): CloudEvent {
    if (!headers) throw new ValidationError("headers is null or undefined");
    if (payload) {
      isStringOrObjectOrThrow(payload, new ValidationError("payload must be an object or a string"));
    }

    if (
      headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] &&
      headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] !== Version.V03 &&
      headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] !== Version.V1
    ) {
      throw new ValidationError(`invalid spec version ${headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]}`);
    }

    payload = isString(payload) && isBase64(payload) ? Buffer.from(payload as string, "base64").toString() : payload;

    // Clone and low case all headers names
    const sanitizedHeaders = validate(headers);

    const eventObj: { [key: string]: unknown | string | Record<string, unknown> } = {};
    const parserMap: Record<string, MappedParser> = this.version === Version.V1 ? v1binaryParsers : v03binaryParsers;

    for (const header in parserMap) {
      if (sanitizedHeaders[header]) {
        const mappedParser: MappedParser = parserMap[header];
        eventObj[mappedParser.name] = mappedParser.parser.parse(sanitizedHeaders[header]);
        delete sanitizedHeaders[header];
      }
    }

    let parsedPayload;

    if (payload) {
      const parser = parserByContentType[eventObj.datacontenttype as string];
      if (!parser) {
        throw new ValidationError(`no parser found for content type ${eventObj.datacontenttype}`);
      }
      parsedPayload = parser.parse(payload);
    }

    // Every unprocessed header can be an extension
    for (const header in sanitizedHeaders) {
      if (header.startsWith(CONSTANTS.EXTENSIONS_PREFIX)) {
        eventObj[header.substring(CONSTANTS.EXTENSIONS_PREFIX.length)] = headers[header];
      }
    }
    // At this point, if the datacontenttype is application/json and the datacontentencoding is base64
    // then the data has already been decoded as a string, then parsed as JSON. We don't need to have
    // the datacontentencoding property set - in fact, it's incorrect to do so.
    if (
      eventObj.datacontenttype === CONSTANTS.MIME_JSON &&
      eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64
    ) {
      delete eventObj.datacontentencoding;
    }

    const cloudevent = new CloudEvent({ ...eventObj, data: parsedPayload } as CloudEventV1 | CloudEventV03);
    this.version === Version.V1 ? validateV1(cloudevent) : validateV03(cloudevent);
    return cloudevent;
  }
}
