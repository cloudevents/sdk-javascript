/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Headers as CloudEventHeaders, Message } from "../../message";
import { Options, TransportFunction } from "../emitter";

/** The request options accepted by the Fetch implementation in the current environment */
export type FetchRequestInit = NonNullable<Parameters<typeof globalThis.fetch>[1]>;

/** The header forms accepted by the Fetch implementation in the current environment */
export type FetchHeadersInit = NonNullable<FetchRequestInit["headers"]>;

/** Options applied to every request sent by an HTTP transport */
export interface HTTPTransportOptions {
  /** HTTP headers applied to every request, per-send headers take precedence */
  headers?: FetchHeadersInit;
  /** Fetch options applied to every request, apart from the ones this transport controls */
  fetchOptions?: Omit<FetchRequestInit, "method" | "headers" | "body" | "signal">;
}

/** The native Fetch response and its body, read as text */
export interface HTTPTransportResponse {
  response: Response;
  body: string;
}

/** A transport that returns an HTTP response */
export type HTTPTransportFunction = TransportFunction<HTTPTransportResponse>;

/**
 * Send an HTTP-bound CloudEvent with Fetch. The transport sends once and resolves with
 * the native response and its body as text, for every HTTP status. Redirects are not
 * followed unless fetchOptions.redirect enables them. Credentials in the sink URL become
 * an authorization header, overridden by transport or per-send headers.
 *
 * @param {string|URL} sink the destination endpoint for the event
 * @param {HTTPTransportOptions} options headers and Fetch request options
 * @returns {HTTPTransportFunction} a function that sends CloudEvents to the sink
 */
export function httpTransport(
  sink: string | URL, options: HTTPTransportOptions = {},
): HTTPTransportFunction {
  const url = validateHTTPURL(sink);
  // fetch refuses a URL with credentials
  const sinkHeaders = credentialsFrom(url);
  const transportHeaders = headersFrom(options.headers);
  const fetchOptions: FetchRequestInit = {
    ...options.fetchOptions,
    // fetch reads an explicitly undefined redirect as absent, so the default comes last
    redirect: options.fetchOptions?.redirect ?? "manual",
    method: "POST",
  };

  return async (message: Message, sendOptions?: Options): Promise<HTTPTransportResponse> => {
    const headers = requestHeaders(
      sinkHeaders, message.headers, transportHeaders, headersFrom(sendOptions?.headers),
    );
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: message.body as BodyInit,
    });
    return { response, body: await response.text() };
  };
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
 * @param {CloudEventHeaders} messageHeaders the headers of the event Message
 * @param {Headers} transportHeaders the headers configured on this transport, if any
 * @param {Headers} sendHeaders the headers supplied with this send, if any
 * @returns {Headers} the headers to send
 */
function requestHeaders(
  sinkHeaders: Headers | undefined, messageHeaders: CloudEventHeaders,
  transportHeaders?: Headers, sendHeaders?: Headers,
): Headers {
  const headers = new Headers();
  // lowest precedence first: sink credentials, binding, transport, this send
  setHeaders(headers, sinkHeaders);
  setHeaders(headers, messageHeaders);
  setHeaders(headers, transportHeaders);
  setHeaders(headers, sendHeaders);
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
 * Copy headers onto a target, replacing any that are already there
 *
 * @param {Headers} target the headers being built
 * @param {CloudEventHeaders|Headers} source the headers to copy, undefined ones are ignored
 * @returns {void}
 */
function setHeaders(target: Headers, source?: CloudEventHeaders | Headers): void {
  if (source === undefined) {
    return;
  }
  if (source instanceof Headers) {
    source.forEach((value, name) => target.set(name, value));
    return;
  }
  for (const [name, value] of Object.entries(source as Record<string, unknown>)) {
    const headerValue = headerValueFrom(value);
    if (headerValue !== undefined) {
      target.set(name, headerValue);
    }
  }
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
