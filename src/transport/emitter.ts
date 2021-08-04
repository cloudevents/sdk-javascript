/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEvent } from "../event/cloudevent";
import { HTTP, Message, Mode } from "../message";
import { EventEmitter } from "events";

/**
 * Options is an additional, optional dictionary of options that may
 * be passed to an EmitterFunction and TransportFunction
 * @interface
 */
export interface Options {
  [key: string]: string | Record<string, unknown> | unknown;
}

/**
 * EmitterFunction is an invokable interface returned by {@linkcode emitterFor}.
 * Invoke an EmitterFunction with a CloudEvent and optional transport
 * options to send the event as a Message across supported transports.
 * @interface
 */
export interface EmitterFunction {
  (event: CloudEvent, options?: Options): Promise<unknown>;
}

/**
 * TransportFunction is an invokable interface provided to the emitterFactory.
 * A TransportFunction's responsiblity is to send a JSON encoded event Message
 * across the wire.
 * @interface
 */
export interface TransportFunction {
  (message: Message, options?: Options): Promise<unknown>;
}

const emitterDefaults: Options = { binding: HTTP, mode: Mode.BINARY };
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
export function emitterFor(fn: TransportFunction, options = emitterDefaults): EmitterFunction {
  if (!fn) {
    throw new TypeError("A TransportFunction is required");
  }
  const { binding, mode }: any = { ...emitterDefaults, ...options };
  return function emit(event: CloudEvent, opts?: Options): Promise<unknown> {
    opts = opts || {};

    switch (mode) {
      case Mode.BINARY:
        return fn(binding.binary(event), opts);
      case Mode.STRUCTURED:
        return fn(binding.structured(event), opts);
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
  static async emitEvent(event: CloudEvent, ensureDelivery = true): Promise<void> {
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
