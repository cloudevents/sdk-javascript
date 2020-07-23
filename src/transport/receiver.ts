import { Headers, sanitize } from "./http/headers";
import { CloudEvent, Version, ValidationError } from "..";
import { BinaryHTTPReceiver as BinaryReceiver } from "./http/binary_receiver";
import { StructuredHTTPReceiver as StructuredReceiver } from "./http/structured_receiver";
import { CloudEventV03 } from "../event/v03";
import { CloudEventV1 } from "../event/v1";
import { Protocol } from "./protocols";
import CONSTANTS from "../constants";

/**
 * An enum representing the two HTTP transport modes, binary and structured
 */
export enum Mode {
  BINARY = "binary",
  STRUCTURED = "structured",
}

/**
 * A class to receive a CloudEvent from an HTTP POST request.
 */
export class Receiver {
  protocol: Protocol;
  receivers: {
    v1: {
      structured: StructuredReceiver;
      binary: BinaryReceiver;
      [key: string]: unknown;
    };
    v03: {
      structured: StructuredReceiver;
      binary: BinaryReceiver;
      [key: string]: unknown;
    };
  };

  /**
   * Create an instance of an HTTPReceiver to accept incoming CloudEvents.
   * @param {Protocol} protocol the transport protocol - currently only Protocol.HTTP is supported
   */
  constructor(protocol: Protocol = Protocol.HTTP) {
    // currently unused, but reserved for future protocol implementations
    this.protocol = protocol;
    this.receivers = {
      v1: {
        structured: new StructuredReceiver(Version.V1),
        binary: new BinaryReceiver(Version.V1),
      },
      v03: {
        structured: new StructuredReceiver(Version.V03),
        binary: new BinaryReceiver(Version.V03),
      },
    };
  }
  /**
   * Acceptor for an incoming HTTP CloudEvent POST. Can process
   * binary and structured incoming CloudEvents.
   *
   * @param {Object} headers HTTP headers keyed by header name ("Content-Type")
   * @param {Object|JSON} body The body of the HTTP request
   * @return {CloudEvent} A new {CloudEvent} instance
   */
  accept(
    headers: Headers,
    body: string | Record<string, unknown> | CloudEventV1 | CloudEventV03 | undefined | null,
  ): CloudEvent {
    const cleanHeaders: Headers = sanitize(headers);
    const mode: Mode = getMode(cleanHeaders);
    const version = getVersion(mode, cleanHeaders, body);
    switch (version) {
      case Version.V1:
        return this.receivers.v1[mode].parse(body, headers);
      case Version.V03:
        return this.receivers.v03[mode].parse(body, headers);
      default:
        console.error(`Unknown spec version ${version}. Default to ${Version.V1}`);
        return this.receivers.v1[mode].parse(body, headers);
    }
  }
}

/**
 * Determines the HTTP transport mode (binary or structured) based
 * on the incoming HTTP headers.
 * @param {Headers} headers the incoming HTTP headers
 * @returns {Mode} the transport mode
 */
function getMode(headers: Headers): Mode {
  const contentType = headers[CONSTANTS.HEADER_CONTENT_TYPE];
  if (contentType && contentType.startsWith(CONSTANTS.MIME_CE)) {
    return Mode.STRUCTURED;
  }
  if (headers[CONSTANTS.CE_HEADERS.ID]) {
    return Mode.BINARY;
  }
  throw new ValidationError("no cloud event detected");
}

/**
 * Determines the version of an incoming CloudEvent based on the
 * HTTP headers or HTTP body, depending on transport mode.
 * @param {Mode} mode the HTTP transport mode
 * @param {Headers} headers the incoming HTTP headers
 * @param {Record<string, unknown>} body the HTTP request body
 * @returns {Version} the CloudEvent specification version
 */
function getVersion(
  mode: Mode,
  headers: Headers,
  body: string | Record<string, unknown> | CloudEventV03 | CloudEventV1 | undefined | null,
) {
  if (mode === Mode.BINARY) {
    // Check the headers for the version
    const versionHeader = headers[CONSTANTS.CE_HEADERS.SPEC_VERSION];
    if (versionHeader) {
      return versionHeader;
    }
  } else {
    // structured mode - the version is in the body
    return typeof body === "string" ? JSON.parse(body).specversion : (body as CloudEvent).specversion;
  }
  return Version.V1;
}
