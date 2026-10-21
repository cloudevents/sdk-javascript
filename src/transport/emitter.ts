/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEvent } from "../event/cloudevent";
import { Headers as CloudEventHeaders, HTTP, Message, Mode } from "../message";
import { EventEmitter } from "events";
import type {
  FetchHeadersInit, HTTPTransportFunction, HTTPTransportResponse, HTTPTransportSendOptions,
} from "./http";

/**
 * Options is an additional, optional dictionary of options that may
 * be passed to an EmitterFunction and TransportFunction
 * @interface
 */
export interface Options<THeaders = CloudEventHeaders> {
  /** Aborts the send, for transports that support cancellation */
  signal?: AbortSignal;
  /** Headers for this send, taking precedence over the ones the binding produced */
  headers?: THeaders;
  [key: string]: string | Record<string, unknown> | unknown;
}

/**
 * EmitterFunction is an invokable interface returned by {@linkcode emitterFor}.
 * Invoke an EmitterFunction with a CloudEvent and optional transport
 * options to send the event as a Message across supported transports.
 * TResult is whatever the underlying {@linkcode TransportFunction} resolves with.
 * @interface
 */
export interface EmitterFunction<TResult = unknown, TOptions = Options> {
  <T>(event: CloudEvent<T>, options?: TOptions): Promise<TResult>;
}

/**
 * An emitter backed by the built-in HTTP transport. A response handler passed with one event
 * determines the body type for that call; otherwise the transport's default body type is used.
 */
export interface HTTPEmitterFunction<TDefaultBody = string>
  extends EmitterFunction<HTTPTransportResponse<TDefaultBody>, Options<FetchHeadersInit>> {
  <TEvent, TBody>(
    event: CloudEvent<TEvent>, options: HTTPTransportSendOptions<TBody>,
  ): Promise<HTTPTransportResponse<TBody>>;
}

/**
 * TransportFunction is an invokable interface provided to the emitterFactory.
 * A TransportFunction's responsiblity is to send a JSON encoded event Message
 * across the wire. TResult is the value it resolves with, e.g. an HTTP client's
 * response, or void for a transport that has nothing to hand back.
 * @interface
 */
export interface TransportFunction<TResult = unknown, TOptions = Options> {
  (message: Message, options?: TOptions): Promise<TResult>;
}

const emitterDefaults: Options = { binding: HTTP, mode: Mode.BINARY };
/**
 * Creates and returns an {@linkcode HTTPEmitterFunction} using the built-in HTTP
 * transport returned by `httpTransport()`. The returned function converts a
 * {@linkcode CloudEvent} into a {@linkcode Message} the same way the generic overload
 * below does, and resolves with what the sink sent back, or rejects with an
 * `HTTPTransportError`.
 *
 * @param {HTTPTransportFunction} fn the built-in HTTP transport to send events with
 * @param { {Binding, Mode} } options network binding and message serialization options
 * @returns {HTTPEmitterFunction} an emitter which resolves with the sink's response
 */
export function emitterFor<TBody>(
  fn: HTTPTransportFunction<TBody>, options?: Options,
): HTTPEmitterFunction<TBody>;
/**
 * Creates and returns an {@linkcode EmitterFunction} using the supplied
 * {@linkcode TransportFunction}. The returned {@linkcode EmitterFunction}
 * will invoke the {@linkcode Binding}'s `binary` or `structured` function
 * to convert a {@linkcode CloudEvent} into a JSON
 * {@linkcode Message} based on the {@linkcode Mode} provided, and invoke the
 * TransportFunction with the Message and any supplied options.
 *
 * @param {TransportFunction} fn a TransportFunction that can accept an event Message
 * @param { {Binding, Mode} } options network binding and message serialization options
 * @param {Binding} options.binding a transport binding, e.g. HTTP
 * @param {Mode} options.mode the encoding mode (Mode.BINARY or Mode.STRUCTURED)
 * @returns {EmitterFunction} an EmitterFunction to send events with
 */
export function emitterFor<TResult = unknown, TOptions = Options>(
  fn: TransportFunction<TResult, TOptions>, options?: Options,
): EmitterFunction<TResult, TOptions>;
export function emitterFor<TResult = unknown, TOptions = Options>(
  fn: TransportFunction<TResult, TOptions>, options: Options = emitterDefaults,
): EmitterFunction<TResult, TOptions> {
  if (!fn) {
    throw new TypeError("A TransportFunction is required");
  }
  const { binding, mode }: any = { ...emitterDefaults, ...options };
  return function emit<T>(event: CloudEvent<T>, opts?: TOptions): Promise<TResult> {
    const transportOptions = opts ?? {} as TOptions;

    switch (mode) {
      case Mode.BINARY:
        return fn(binding.binary(event), transportOptions);
      case Mode.STRUCTURED:
        return fn(binding.structured(event), transportOptions);
      default:
        throw new TypeError(`Unexpected transport mode: ${mode}`);
    }
  };
}

/**
 * A helper class to emit CloudEvents within an application
 */
export class Emitter {
  /**
   * Singleton store
   */
  static instance: EventEmitter | undefined = undefined;

  /**
   * Return or create the Emitter singleton
   *
   * @return {Emitter} return Emitter singleton
   */
  static getInstance(): EventEmitter {
    if (!Emitter.instance) {
      Emitter.instance = new EventEmitter();
    }
    return Emitter.instance;
  }

  /**
   * Add a listener for eventing
   *
   * @param {string} event type to listen to
   * @param {Function} listener to call on event
   * @return {void}
   */
  static on(event: "cloudevent" | "newListener" | "removeListener", listener: (...args: any[]) => void): void {
    Emitter.getInstance().on(event, listener);
  }

  /**
   * Emit an event inside this application
   *
   * @param {CloudEvent} event to emit
   * @param {boolean} ensureDelivery fail the promise if one listener fails
   * @return {void}
   */
  static async emitEvent<T>(event: CloudEvent<T>, ensureDelivery = true): Promise<void> {
    if (!ensureDelivery) {
      // Ensure delivery is disabled so we don't wait for Promise
      Emitter.getInstance().emit("cloudevent", event);
    } else {
      // Execute all listeners and wrap them in a Promise
      await Promise.all(
        Emitter.getInstance()
          .listeners("cloudevent")
          .map(async (l) => l(event)),
      );
    }
  }
}
