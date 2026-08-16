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

/** Turns a Fetch response into the body value handed back by the HTTP transport */
export type HTTPResponseHandler<TBody> = (response: Response) => Promise<TBody>;

/**
 * Read a response body as text, the default behavior of the HTTP transport
 *
 * @param {Response} response the response whose body should be read
 * @returns {Promise<string>} the response body as text
 */
export function httpTextResponseHandler(response: Response): Promise<string> {
  return response.text();
}

/**
 * Discard a response body when the caller only needs the response metadata
 *
 * @param {Response} response the response whose body should be discarded
 * @returns {Promise<void>} completion after the body has been cancelled
 */
export async function httpDiscardResponseHandler(response: Response): Promise<void> {
  await response.body?.cancel();
}

/**
 * Options applied to every request sent by an HTTP transport
 */
export interface HTTPTransportOptions<TBody = string> {
  /** HTTP headers applied to every request, per-send headers take precedence */
  headers?: FetchHeadersInit;
  /**
   * Aborts every request sent by this transport, combined with the per-send signal. It lasts
   * as long as the transport does, so set a per-request deadline on the per-send signal
   */
  signal?: AbortSignal;
  /** Fetch options applied to every request, apart from the ones this transport controls */
  fetchOptions?: Omit<FetchRequestInit, "method" | "headers" | "body" | "signal">;
  /** Reads every response body; defaults to {@linkcode httpTextResponseHandler} */
  responseHandler?: HTTPResponseHandler<TBody>;
}

/**
 * Options which replace the response handler for one send
 */
export interface HTTPTransportSendOptions<TBody> extends Options<FetchHeadersInit> {
  /** Reads this response body instead of the handler configured for the transport */
  responseHandler: HTTPResponseHandler<TBody>;
}

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

/**
 * An HTTP transport whose default response body type can be replaced for one send
 */
export interface HTTPTransportFunction<TDefaultBody = string>
  extends TransportFunction<HTTPTransportResponse<TDefaultBody>, Options<FetchHeadersInit>> {
  <TBody>(message: Message, options: HTTPTransportSendOptions<TBody>): Promise<HTTPTransportResponse<TBody>>;
}

/** The result of attempting to handle a response body */
type HandledResponse =
  | { handled: true; body: unknown }
  | { handled: false; error: unknown };

/** An abort signal scoped to one send, and the cleanup which ends that scope */
interface CombinedSignal {
  signal?: AbortSignal;
  dispose: () => void;
}

/** Subscribers sharing the one platform listener attached to an abort signal */
interface AbortFanout {
  subscribers: Set<() => void>;
  listener: () => void;
  listening: boolean;
}

/** Active fan-outs, weakly keyed so an otherwise unused signal can still be collected */
const abortFanouts = new WeakMap<AbortSignal, AbortFanout>();

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
export type HTTPTransportErrorDetails = Pick<HTTPTransportError, "response" | "body" | "cause">;

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
 * Every response body is passed to the configured response handler. It is read as text by
 * default; a handler passed with one send takes precedence over the transport's handler.
 * A handler may also return `response.body` to hand the stream to the caller, who then
 * has to cancel it if it is not read to the end, since the abort signals no longer apply
 * once the handler has resolved.
 *
 * Credentials in _sink_ are sent as an `authorization` header, which the `headers` option
 * and the headers of one send override.
 *
 * @param {string|URL} sink the destination endpoint for the event
 * @param {HTTPTransportOptions} options headers, Fetch options, abort and response behavior
 * @returns {HTTPTransportFunction} a function that sends CloudEvents to _sink_
 */
export function httpTransport<TBody = string>(
  sink: string | URL, options: HTTPTransportOptions<TBody> = {},
): HTTPTransportFunction<TBody> {
  const url = validateHTTPURL(sink);
  // fetch refuses a URL with credentials
  const sinkHeaders = credentialsFrom(url);
  const transportSignal = signalFrom(options.signal);
  const transportHeaders = headersFrom(options.headers);
  const transportResponseHandler = responseHandlerFrom(options.responseHandler, httpTextResponseHandler);
  const fetchOptions: FetchRequestInit = {
    ...options.fetchOptions,
    // fetch reads an explicitly undefined redirect as absent, so the default comes last
    redirect: options.fetchOptions?.redirect ?? "manual",
    method: "POST",
  };

  const send = async (
    message: Message, sendOptions?: Options<FetchHeadersInit>,
  ): Promise<HTTPTransportResponse<unknown>> => {
    const sendSignal = signalFrom(sendOptions?.signal);
    const headers = requestHeaders(
      sinkHeaders, message.headers, transportHeaders, headersFrom(sendOptions?.headers),
    );
    const responseHandler = responseHandlerFrom(sendOptions?.responseHandler, transportResponseHandler);
    const combinedSignal = combineSignals(transportSignal, sendSignal);
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
  };

  // the overloads type the per-send handler this implementation cannot
  return send as HTTPTransportFunction<TBody>;
}

/**
 * Check a response handler and fall back to the handler from the enclosing transport
 *
 * @param {unknown} value the handler supplied at this layer, if any
 * @param {HTTPResponseHandler} fallback the handler inherited from the transport or default
 * @returns {HTTPResponseHandler} the handler to run
 */
function responseHandlerFrom(
  value: unknown, fallback: HTTPResponseHandler<unknown>,
): HTTPResponseHandler<unknown> {
  if (value === undefined || value === null) {
    return fallback;
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
      await httpDiscardResponseHandler(response);
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
 * Check a signal supplied by a caller, either for this transport or for a single send, by its
 * platform brand rather than the interface prototype of this realm
 *
 * @param {unknown} value the signal supplied by the caller, if any
 * @returns {AbortSignal|undefined} the signal, or undefined when none was supplied
 */
function signalFrom(value: unknown): AbortSignal | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  try {
    // the getter checks the AbortSignal platform brand and accepts signals from another realm
    Reflect.get(AbortSignal.prototype, "aborted", value);
  } catch {
    throw new TypeError("options.signal must be an AbortSignal");
  }
  return value as AbortSignal;
}

/**
 * Create and attach the shared platform listener for one signal
 *
 * @param {AbortSignal} source the signal which owns the listener
 * @returns {AbortFanout} the shared subscriber collection
 */
function createAbortFanout(source: AbortSignal): AbortFanout {
  const subscribers = new Set<() => void>();
  const fanout: AbortFanout = {
    subscribers,
    listening: true,
    listener: () => {
      const current = Array.from(subscribers);
      subscribers.clear();
      fanout.listening = false;
      abortFanouts.delete(source);
      current.forEach((callback) => callback());
    },
  };

  abortFanouts.set(source, fanout);
  source.addEventListener("abort", fanout.listener, { once: true });
  return fanout;
}

/**
 * Subscribe to a signal through one shared platform listener, however many sends use it
 *
 * @param {AbortSignal} source the signal whose abort should be relayed
 * @param {Function} subscriber one send's abort callback
 * @returns {Function} an idempotent function which removes this subscription
 */
function subscribeAbort(source: AbortSignal, subscriber: () => void): () => void {
  const fanout = abortFanouts.get(source) ?? createAbortFanout(source);

  fanout.subscribers.add(subscriber);
  let disposed = false;

  return (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    fanout.subscribers.delete(subscriber);

    if (fanout.listening && fanout.subscribers.size === 0) {
      fanout.listening = false;
      source.removeEventListener("abort", fanout.listener);
      abortFanouts.delete(source);
    }
  };
}

/** The relay for a send which has no signal to relay */
const NO_ABORT: CombinedSignal = { signal: undefined, dispose: () => undefined };

/**
 * Combine abort signals behind a disposable relay, so they apply while the transport is
 * fetching and handling a response without retaining a long-lived source after that work ends
 *
 * `AbortSignal.any()` is not used here. Node.js 24 validates its arguments with `instanceof`,
 * so it rejects the signals from another realm that {@linkcode signalFrom} accepts, with
 * `The "signals[0]" argument must be an instance of AbortSignal`. `addEventListener()` works
 * across realms on every supported version, so the sources are relayed through
 * {@linkcode subscribeAbort}, which also keeps one listener per source however many sends
 * share it.
 *
 * @param {AbortSignal} transportSignal the signal of the transport, if it has one
 * @param {AbortSignal} sendSignal the signal of this send, if it has one
 * @returns {CombinedSignal} the signal for Fetch and an idempotent cleanup function
 */
function combineSignals(transportSignal?: AbortSignal, sendSignal?: AbortSignal): CombinedSignal {
  if (transportSignal === undefined && sendSignal === undefined) {
    return NO_ABORT;
  }
  // a send may pass the transport's own signal, which then only has to be relayed once
  const sources = Array.from(new Set([transportSignal, sendSignal]))
    .filter((signal): signal is AbortSignal => signal !== undefined);

  const controller = new AbortController();
  const unsubscribe: Array<() => void> = [];
  let disposed = false;

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    unsubscribe.forEach((remove) => remove());
    unsubscribe.length = 0;
  };

  const abortFrom = (source: AbortSignal): void => {
    controller.abort(source.reason);
    dispose();
  };

  const alreadyAborted = sources.find((source) => source.aborted);
  if (alreadyAborted) {
    abortFrom(alreadyAborted);
    return { signal: controller.signal, dispose };
  }

  sources.forEach((source) => {
    unsubscribe.push(subscribeAbort(source, () => abortFrom(source)));
  });
  return { signal: controller.signal, dispose };
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
