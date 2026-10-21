/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Headers as CloudEventHeaders, Message } from "../../message";
import CONSTANTS from "../../constants";
import { Options, TransportFunction } from "../emitter";
import { combineSignals, signalFrom } from "../signal";
import { validateHeaderAdditions } from "./headers";

/** The request options accepted by the Fetch implementation in the current environment */
type FetchRequestInit = NonNullable<Parameters<typeof globalThis.fetch>[1]>;

/** The header forms accepted by the Fetch implementation in the current environment */
type FetchHeadersInit = NonNullable<FetchRequestInit["headers"]>;

/** Turns a Fetch response into the body value handed back by the HTTP transport */
export type HTTPResponseHandler<TBody> = (response: Response) => Promise<TBody>;

/**
 * Options applied to every request sent by an HTTP transport
 */
export interface HTTPTransportOptions<TBody = string> {
  /** HTTP headers applied to every request, per-send headers take precedence but neither can change CloudEvents ones */
  headers?: FetchHeadersInit;
  /** Fetch options applied to every request, apart from the ones this transport controls */
  fetchOptions?: Omit<FetchRequestInit, "method" | "headers" | "body" | "signal">;
  /** Reads every response body; defaults to reading it as text */
  responseHandler?: HTTPResponseHandler<TBody>;
}

type HTTPMessageOptions = Pick<Options<FetchHeadersInit>, "headers" | "signal">;

const supportedTransportOptions: Record<keyof HTTPTransportOptions<unknown>, true> = {
  headers: true, fetchOptions: true, responseHandler: true,
};

const supportedSendOptions: Record<keyof HTTPMessageOptions, true> = {
  headers: true, signal: true,
};

/** What the built-in HTTP transport hands back for a send the sink accepted */
export type HTTPTransportResponse<TBody = string> =
  | {
    /** The native Fetch response, whose body has been handled */
    response: Response;
    /** What the configured response handler returned */
    body: TBody;
    bodyError?: never;
  }
  | {
    /** The native Fetch response, whose status is still a successful 2xx */
    response: Response;
    body?: never;
    /** What the response handler threw after the sink accepted the event */
    bodyError: unknown;
  };

/** The result of attempting to handle a response body */
type HandledResponse =
  | { handled: true; body: unknown }
  | { handled: false; error: unknown };

/**
 * The failure category reported by {@linkcode HTTPTransportError}
 *
 * - `http-status`: the sink returned a response that was not 2xx
 * - `aborted`: a signal supplied by the caller aborted the request
 * - `network`: the request never produced a response, e.g. DNS, connection, or TLS failure
 */
export type HTTPTransportErrorKind = "http-status" | "aborted" | "network";

/**
 * What an {@linkcode HTTPTransportError} reports alongside its {@linkcode HTTPTransportErrorKind}
 */
type HTTPTransportErrorDetails = Pick<HTTPTransportError, "response" | "body" | "cause">;

/**
 * A request failure reported by the built-in HTTP transport
 */
export class HTTPTransportError extends Error {
  /** The failure category */
  readonly kind: HTTPTransportErrorKind;
  /** The response the sink sent, present only for `http-status` */
  readonly response?: Response;
  /** What the response handler returned, present when it succeeded for `http-status` */
  readonly body?: unknown;
  /** The underlying failure, e.g. what fetch threw or the reason carried by a signal */
  readonly cause?: unknown;

  constructor(kind: HTTPTransportErrorKind, details: HTTPTransportErrorDetails = {}) {
    super(errorMessage(kind, details));
    this.name = "HTTPTransportError";
    this.kind = kind;
    this.response = details.response;
    this.body = details.body;
    this.cause = details.cause;
  }
}

/**
 * httpTransport provides a simple HTTP Transport function, which can send a CloudEvent,
 * encoded as a Message to the endpoint. The returned function can be used with emitterFor()
 * to provide an event emitter, for example:
 *
 * ```js
 * const emit = emitterFor(httpTransport("http://example.com"));
 * emit(myCloudEvent)
 *    .then(({ response, body }) => console.log(response.status, body))
 *    .catch(err => console.error(err.kind, err.response?.status));
 * ```
 *
 * The event is sent once, without retries. A response that is not 2xx rejects with an
 * {@linkcode HTTPTransportError} holding the response the sink sent back. Redirects are
 * reported as errors unless `fetchOptions.redirect` says otherwise, since Fetch keeps the
 * CloudEvent POST only for 307 and 308 - see the README for the details.
 *
 * Every response body is passed to the configured response handler, or read as text by
 * default. A handler may return `response.body` to hand the stream to the caller, who must
 * cancel it if it is not read to the end. The message's abort signal no longer applies
 * once the handler has resolved.
 *
 * Credentials in _sink_ are sent as an `authorization` header, which the `headers` option
 * and the headers of one send override.
 *
 * @param {string|URL} sink the destination endpoint for the event
 * @param {HTTPTransportOptions} options headers, Fetch options and response behavior
 * @returns {TransportFunction} a function that sends CloudEvents to _sink_
 */
export function httpTransport<TBody = string>(
  sink: string | URL, options?: HTTPTransportOptions<TBody>,
): TransportFunction<HTTPTransportResponse<TBody>, HTTPMessageOptions>;
export function httpTransport(
  sink: string | URL, options: HTTPTransportOptions<unknown> = {},
): TransportFunction<HTTPTransportResponse<unknown>, HTTPMessageOptions> {
  for (const name of Object.keys(options)) {
    if (!Object.prototype.hasOwnProperty.call(supportedTransportOptions, name)) {
      throw new TypeError(`unsupported HTTP transport option: ${name}`);
    }
  }
  const url = validateHTTPURL(sink);
  // fetch refuses a URL with credentials
  const sinkHeaders = credentialsFrom(url);
  const transportHeaders = headersFrom(options.headers);
  const responseHandler = responseHandlerFrom(options.responseHandler);
  const fetchOptions: FetchRequestInit = {
    ...options.fetchOptions,
    // fetch reads an explicitly undefined redirect as absent, so the default comes last
    redirect: options.fetchOptions?.redirect ?? "manual",
    method: "POST",
  };

  async function send(
    message: Message, sendOptions?: HTTPMessageOptions,
  ): Promise<HTTPTransportResponse<unknown>> {
    for (const name of Object.keys(sendOptions ?? {})) {
      if (!Object.prototype.hasOwnProperty.call(supportedSendOptions, name)) {
        throw new TypeError(`unsupported HTTP send option: ${name}`);
      }
    }
    const sendSignal = signalFrom(sendOptions?.signal);
    const headers = requestHeaders(
      sinkHeaders, message, transportHeaders, headersFrom(sendOptions?.headers),
    );
    const combinedSignal = combineSignals(sendSignal);
    try {
      let response: Response;
      try {
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          body: message.body as BodyInit,
          signal: combinedSignal.signal,
        });
      } catch (cause) {
        throw combinedSignal.signal?.aborted
          ? new HTTPTransportError("aborted", { cause: combinedSignal.signal.reason ?? cause })
          : new HTTPTransportError("network", { cause });
      }

      const handled = await handleResponse(response, responseHandler);
      if (!response.ok) {
        // the status is the failure; the handler result or error goes alongside it
        throw new HTTPTransportError("http-status", handled.handled
          ? { response, body: handled.body }
          : { response, cause: handled.error });
      }
      return handled.handled
        ? { response, body: handled.body }
        : { response, bodyError: handled.error };
    } finally {
      combinedSignal.dispose();
    }
  }

  return send;
}

/**
 * Check a response handler and fall back to reading the body as text
 *
 * @param {unknown} value the configured handler, if any
 * @returns {HTTPResponseHandler} the handler to run
 */
function responseHandlerFrom(value: unknown): HTTPResponseHandler<unknown> {
  if (value === undefined || value === null) {
    return (response) => response.text();
  }
  if (typeof value !== "function") {
    throw new TypeError("options.responseHandler must be a function");
  }
  return value as HTTPResponseHandler<unknown>;
}

/**
 * Run the caller's response handler. A handler that resolves may leave its body unread on
 * purpose; one that throws has the rest of its body cancelled, so a failed send does not
 * hold a connection open.
 *
 * @param {Response} response the response to handle
 * @param {HTTPResponseHandler} handler the selected handler
 * @returns {HandledResponse} the handler's body value or thrown error
 */
async function handleResponse(
  response: Response, handler: HTTPResponseHandler<unknown>,
): Promise<HandledResponse> {
  try {
    return { handled: true, body: await handler(response) };
  } catch (error) {
    try {
      await response.body?.cancel();
    } catch {
      // best effort cleanup
    }
    return { handled: false, error };
  }
}

/**
 * Check that the sink is a URL this transport knows how to POST to
 *
 * @param {string|URL} sink the destination endpoint for the event
 * @returns {URL} the parsed sink
 */
function validateHTTPURL(sink: string | URL): URL {
  const url = new URL(sink);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError(`unsupported protocol ${url.protocol}`);
  }
  return url;
}

/**
 * Merge the headers for a single request
 *
 * @param {Headers} sinkHeaders the headers built from the sink URL, if it carried credentials
 * @param {Message} message the event Message
 * @param {Headers} transportHeaders the headers configured on this transport, if any
 * @param {Headers} sendHeaders the headers supplied with this send, if any
 * @returns {Headers} the headers to send
 */
function requestHeaders(
  sinkHeaders: Headers | undefined, message: Message,
  transportHeaders?: Headers, sendHeaders?: Headers,
): Headers {
  const headers = new Headers();
  // lowest precedence first: sink credentials, binding, transport, this send
  setHeaders(headers, sinkHeaders);
  setHeaders(headers, message.headers);
  if (transportHeaders === undefined && sendHeaders === undefined) {
    return headers;
  }
  const original = new Headers(headers);
  setHeaders(headers, transportHeaders);
  setHeaders(headers, sendHeaders);
  validateHeaderAdditions(message, original, headers);
  return headers;
}

/**
 * Move the credentials of a sink URL into the header the old Node.js transport built, since
 * Fetch refuses a URL that carries them
 *
 * @param {URL} url the sink URL, whose credentials are removed
 * @returns {Headers|undefined} the authorization header, or undefined for a URL without credentials
 */
function credentialsFrom(url: URL): Headers | undefined {
  if (url.username === "" && url.password === "") {
    return undefined;
  }
  const userinfo = `${decodeCredential(url.username)}:${decodeCredential(url.password)}`;
  url.username = "";
  url.password = "";
  return new Headers({ authorization: `Basic ${base64(userinfo)}` });
}

/**
 * Read one percent-encoded credential of a sink URL, as urlToHttpOptions() did for the old
 * transport
 *
 * @param {string} value the credential as the URL holds it
 * @returns {string} the decoded credential
 */
function decodeCredential(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new TypeError("sink credentials must be percent-encoded values");
  }
}

/**
 * Encode credentials as UTF-8 bytes, the way RFC 7617 and the old transport did, with APIs the
 * browser bundle can use as well
 *
 * @param {string} value the credentials to encode
 * @returns {string} the base64 form
 */
function base64(value: string): string {
  const utf8 = new TextEncoder().encode(value);
  return btoa(Array.from(utf8, (byte) => String.fromCharCode(byte)).join(""));
}

/**
 * Check the headers a caller supplied, either for this transport or for a single send
 *
 * Fetch does the conversion, so every form its `HeadersInit` accepts arrives intact, a
 * `Headers` from another realm included. That leaves an untyped value to Fetch's own coercion,
 * which is why a caller's array joins on "," while the array of a Message, normalized by
 * {@linkcode headerValueFrom}, joins on ", "
 *
 * @param {unknown} source the headers supplied by the caller, if any
 * @returns {Headers|undefined} the headers, or undefined when none were supplied
 */
function headersFrom(source: unknown): Headers | undefined {
  if (source === undefined || source === null) {
    return undefined;
  }
  return new Headers(source as FetchHeadersInit);
}

/**
 * Merge headers, rejecting changes to CloudEvents headers and the ones Fetch controls
 *
 * @param {Headers} target the headers being built
 * @param {CloudEventHeaders|Headers} source the headers to copy, undefined ones are ignored
 * @returns {void}
 */
function setHeaders(target: Headers, source?: CloudEventHeaders | Headers): void {
  if (source === undefined) {
    return;
  }
  const headers = source instanceof Headers ? source : normalizeHeaders(source);
  headers.forEach((value, name) => {
    if (name === "host" || name === "content-length") {
      throw new TypeError(`${name} is controlled by Fetch`);
    }
    if ((name.startsWith(CONSTANTS.EXTENSIONS_PREFIX) || name === CONSTANTS.HEADER_CONTENT_TYPE)
      && target.has(name)) {
      throw new TypeError(`cannot override CloudEvents header: ${name}`);
    }
    target.set(name, value);
  });
}

/**
 * Collect the headers of a Message, so names are lowercased and a repeated name keeps its last value
 *
 * @param {CloudEventHeaders} source the headers of the Message
 * @returns {Headers} the headers, without the undefined ones
 */
function normalizeHeaders(source: CloudEventHeaders): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(source)) {
    const headerValue = headerValueFrom(value);
    if (headerValue !== undefined) {
      headers.set(name, headerValue);
    }
  }
  return headers;
}

/**
 * Read a header value, whatever form it arrived in
 *
 * @param {unknown} value the value to read
 * @returns {string|undefined} the value to send, undefined for a header which is not to be sent
 */
function headerValueFrom(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  // several values join; an absent one is skipped
  if (Array.isArray(value)) {
    const values = value.filter((item) => item !== undefined && item !== null);
    return values.length > 0 ? values.join(", ") : undefined;
  }
  return String(value);
}

/**
 * Build the message for an {@linkcode HTTPTransportError}
 *
 * @param {HTTPTransportErrorKind} kind the failure category
 * @param {HTTPTransportErrorDetails} details what is known about the failure
 * @returns {string} the error message
 */
function errorMessage(kind: HTTPTransportErrorKind, details: HTTPTransportErrorDetails): string {
  switch (kind) {
    case "http-status":
      return `HTTP transport received a non-2xx response: ${details.response?.status}`;
    case "aborted":
      return "HTTP transport request was aborted";
    default:
      return "HTTP transport request failed";
  }
}
