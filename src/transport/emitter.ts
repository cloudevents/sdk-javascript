import { CloudEvent } from "../event/cloudevent";
import { HTTP, Message, Mode } from "../message";
import { EventEmitter } from "events";

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
 * A static class to emit CloudEvents within an application
 */
export class Emitter extends EventEmitter {
  /**
   * Singleton store
   */
  static singleton: Emitter | undefined = undefined;

  /**
   * Create an Emitter
   * On v4.0.0 this class will only remains as Singleton to allow using the
   * EventEmitter of NodeJS
   */
  private constructor() {
    super();
  }

  /**
   * Return or create the Emitter singleton
   *
   * @return {Emitter} return Emitter singleton
   */
  static getSingleton(): Emitter {
    if (!Emitter.singleton) {
      Emitter.singleton = new Emitter();
    }
    return Emitter.singleton;
  }

  /**
   * Emit an event inside this application
   *
   * @param {CloudEvent} event to emit
   * @return {void}
   */
  static emitEvent(event: CloudEvent): void {
    this.getSingleton().emit("event", event);
  }
}
