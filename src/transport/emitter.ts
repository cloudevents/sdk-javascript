import { CloudEvent } from "../event/cloudevent";
import { axiosEmitter } from "./http";
import { Protocol } from "./protocols";
import { Agent } from "http";
import { HTTP, Message, Mode } from "../message";

/**
 * Options supplied to the Emitter when sending an event.
 * In addition to url and protocol, TransportOptions may
 * also accept custom options that will be passed to the
 * Node.js http functions.
 * @deprecated will be removed in 4.0.0
 */
export interface TransportOptions {
  /**
   * The endpoint that will receieve the event.
   * @example http://cncf.example.com/receiver
   */
  url?: string;
  /**
   * The network protocol over which the event will be sent.
   * @example HTTPStructured
   * @example HTTPBinary
   */
  protocol?: Protocol;

  [key: string]: string | Record<string, unknown> | Protocol | Agent | undefined;
}

/**
 * Options is an additional, optional dictionary of options that may
 * be passed to an EmitterFunction and TransportFunction
 */
export interface Options {
  [key: string]: string | Record<string, unknown> | unknown;
}

/**
 * EmitterFunction is an invokable interface returned by the emitterFactory
 * function. Invoke an EmitterFunction with a CloudEvent and optional transport
 * options to send the event as a Message across supported transports.
 */
export interface EmitterFunction {
  (event: CloudEvent, options?: Options): Promise<unknown>;
}

/**
 * TransportFunction is an invokable interface provided to the emitterFactory.
 * A TransportFunction's responsiblity is to send a JSON encoded event Message
 * across the wire.
 */
export interface TransportFunction {
  (message: Message, options?: Options): Promise<unknown>;
}

/**
 * emitterFactory creates and returns an EmitterFunction using the supplied
 * TransportFunction. The returned EmitterFunction will invoke the Binding's
 * `binary` or `structured` function to convert a CloudEvent into a JSON
 * Message based on the Mode provided, and invoke the TransportFunction with
 * the Message and any supplied options.
 *
 * @param {TransportFunction} fn a TransportFunction that can accept an event Message
 * @param { {Binding, Mode} } options network binding and message serialization options
 * @param {Binding} options.binding a transport binding, e.g. HTTP
 * @param {Mode} options.mode the encoding mode (Mode.BINARY or Mode.STRUCTURED)
 * @returns {EmitterFunction} an EmitterFunction to send events with
 */
export function emitterFor(fn: TransportFunction, options = { binding: HTTP, mode: Mode.BINARY }): EmitterFunction {
  if (!fn) {
    throw new TypeError("A TransportFunction is required");
  }
  const { binding, mode } = options;
  return function emit(event: CloudEvent, options?: Options): Promise<unknown> {
    options = options || {};

    switch (mode) {
      case Mode.BINARY:
        return fn(binding.binary(event), options);
      case Mode.STRUCTURED:
        return fn(binding.structured(event), options);
      default:
        throw new TypeError(`Unexpected transport mode: ${mode}`);
    }
  };
}

/**
 * A class to send binary and structured CloudEvents to a remote endpoint.
 * Currently, supported protocols are HTTPBinary and HTTPStructured.
 *
 * @see https://github.com/cloudevents/spec/blob/v1.0/http-protocol-binding.md
 * @see https://github.com/cloudevents/spec/blob/v1.0/http-protocol-binding.md#13-content-modes
 * @deprecated Will be removed in 4.0.0. Consider using the emitterFactory
 *
 */
export class Emitter {
  url?: string;
  protocol: Protocol;
  binaryEmitter: EmitterFunction;
  structuredEmitter: EmitterFunction;

  constructor(options: TransportOptions = { protocol: Protocol.HTTPBinary }) {
    this.protocol = options.protocol as Protocol;
    this.url = options.url;

    this.binaryEmitter = emitterFor(axiosEmitter(this.url as string));
    this.structuredEmitter = emitterFor(axiosEmitter(this.url as string), { binding: HTTP, mode: Mode.STRUCTURED });
  }

  /**
   * Sends the {CloudEvent} to an event receiver over HTTP POST
   *
   * @param {CloudEvent} event the CloudEvent to be sent
   * @param {Object} [options] The configuration options for this event. Options
   * provided will be passed along to Node.js `http.request()`.
   * https://nodejs.org/api/http.html#http_http_request_options_callback
   * @param {string} [options.url] The HTTP/S url that should receive this event.
   * The URL is optional if one was provided when this emitter was constructed.
   * In that case, it will be used as the recipient endpoint. The endpoint can
   * be overridden by providing a URL here.
   * @returns {Promise} Promise with an eventual response from the receiver
   * @deprecated Will be removed in 4.0.0. Consider using the emitterFactory
   */
  send(event: CloudEvent, options?: TransportOptions): Promise<unknown> {
    options = options || {};
    options.url = options.url || this.url;
    if (options.protocol != this.protocol) {
      if (this.protocol === Protocol.HTTPBinary) return this.binaryEmitter(event, options);
      return this.structuredEmitter(event, options);
    }
    return this.binaryEmitter(event, options);
  }
}
