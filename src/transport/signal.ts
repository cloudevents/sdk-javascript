/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

/**
 * Check a signal supplied by a caller, whether it was given to a transport, to a single send,
 * or to an emitter wrapper, by its platform brand rather than the interface prototype of this
 * realm
 *
 * @param {unknown} value the signal supplied by the caller, if any
 * @returns {AbortSignal|undefined} the signal, or undefined when none was supplied
 */
export function signalFrom(value: unknown): AbortSignal | undefined {
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
 * Read the conventional signal from otherwise transport-specific send options
 *
 * @param {unknown} options the options passed to one emitter invocation
 * @returns {AbortSignal|undefined} the validated signal, when one was supplied
 */
export function signalFromOptions(options: unknown): AbortSignal | undefined {
  if (typeof options !== "object" || options === null) {
    return undefined;
  }
  return signalFrom((options as { signal?: unknown }).signal);
}

/** An abort signal scoped to one operation, and the cleanup which ends that scope */
export interface CombinedSignal {
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

/** The relay for an operation which has no signal to relay */
const NO_ABORT: CombinedSignal = { signal: undefined, dispose: () => undefined };

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
 * Subscribe to a signal through one shared platform listener, however many operations use it
 *
 * @param {AbortSignal} source the signal whose abort should be relayed
 * @param {Function} subscriber one operation's abort callback
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

/**
 * Combine abort signals behind a disposable relay, so they apply only while an operation is
 * running and do not retain a long-lived source after that work ends.
 *
 * `AbortSignal.any()` is not used here. Node.js 24 validates its arguments with `instanceof`,
 * so it rejects the signals from another realm that {@linkcode signalFrom} accepts, with
 * `The "signals[0]" argument must be an instance of AbortSignal`. `addEventListener()` works
 * across realms on every supported version, so the sources are relayed through
 * {@linkcode subscribeAbort}, which also keeps one listener per source however many operations
 * share it.
 *
 * @param {Array<AbortSignal|undefined>} candidates the signals which can abort the operation
 * @returns {CombinedSignal} the combined signal and an idempotent cleanup function
 */
export function combineSignals(...candidates: Array<AbortSignal | undefined>): CombinedSignal {
  const sources = Array.from(new Set(candidates))
    .filter((signal): signal is AbortSignal => signal !== undefined);
  if (sources.length === 0) {
    return NO_ABORT;
  }

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
