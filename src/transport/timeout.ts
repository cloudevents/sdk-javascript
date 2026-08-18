/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEvent } from "../event/cloudevent";
import { EmitterFunction, HTTPEmitterFunction } from "./emitter";
import { combineSignals, signalFromOptions } from "./signal";

const MAX_TIMEOUT_MS = 2_147_483_647;

/** A timeout signal and the cleanup which cancels its pending timer */
interface TimeoutSignal {
  signal: AbortSignal;
  dispose: () => void;
}

/**
 * Give each invocation of a built-in HTTP emitter its own timeout. Per-send response handlers
 * retain the response body type they return.
 *
 * @param {HTTPEmitterFunction} emitter the emitter to invoke with a timeout signal
 * @param {number} timeoutMs the maximum duration of one invocation in milliseconds, from 0 to 2147483647
 * @returns {HTTPEmitterFunction} an emitter with the same call signatures and a per-send timeout
 */
export function withTimeout<TBody>(
  emitter: HTTPEmitterFunction<TBody>, timeoutMs: number,
): HTTPEmitterFunction<TBody>;
/**
 * Give each invocation of an {@linkcode EmitterFunction} its own timeout. The wrapped emitter
 * must honor `options.signal`. When a caller also supplies a signal, either that signal or the
 * timeout can abort the invocation. Other send options are preserved.
 *
 * Wrapping `withTimeout` inside `withRetry` starts a fresh timeout for every attempt. Wrapping
 * `withRetry` inside `withTimeout` applies one timeout across all attempts and backoff waits.
 *
 * @param {EmitterFunction} emitter the emitter to invoke with a timeout signal
 * @param {number} timeoutMs the maximum duration of one invocation in milliseconds, from 0 to 2147483647
 * @returns {EmitterFunction} an emitter with the same result and option types
 */
export function withTimeout<TResult, TOptions extends { signal?: AbortSignal }>(
  emitter: EmitterFunction<TResult, TOptions>, timeoutMs: number,
): EmitterFunction<TResult, TOptions>;
export function withTimeout<TResult, TOptions extends { signal?: AbortSignal }>(
  emitter: EmitterFunction<TResult, TOptions>, timeoutMs: number,
): EmitterFunction<TResult, TOptions> {
  if (typeof emitter !== "function") {
    throw new TypeError("An EmitterFunction is required");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0) {
    throw new TypeError("timeoutMs must be a non-negative safe integer");
  }
  if (timeoutMs > MAX_TIMEOUT_MS) {
    throw new RangeError(`timeoutMs cannot be greater than ${MAX_TIMEOUT_MS}`);
  }

  return async function emitWithTimeout<T>(
    event: CloudEvent<T>, sendOptions?: TOptions,
  ): Promise<TResult> {
    const callerSignal = signalFromOptions(sendOptions);
    const timeout = timeoutSignal(timeoutMs);
    const combinedSignal = combineSignals(callerSignal, timeout.signal);

    try {
      return await emitter(event, {
        ...sendOptions,
        signal: combinedSignal.signal,
      } as TOptions);
    } finally {
      combinedSignal.dispose();
      timeout.dispose();
    }
  };
}

/**
 * Create a timeout signal and a cleanup which cancels its timer
 *
 * @param {number} milliseconds the duration before the signal aborts
 * @returns {TimeoutSignal} the timeout signal and an idempotent timer cleanup function
 */
function timeoutSignal(milliseconds: number): TimeoutSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(timeoutError()), milliseconds);
  const dispose = (): void => clearTimeout(timer);

  return { signal: controller.signal, dispose };
}

/**
 * Create the standard reason carried by an AbortSignal timeout
 *
 * @returns {DOMException} a TimeoutError suitable as an abort reason
 */
function timeoutError(): DOMException {
  return new DOMException("The operation was aborted due to timeout", "TimeoutError");
}
