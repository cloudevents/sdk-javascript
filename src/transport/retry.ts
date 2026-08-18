/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEvent } from "../event/cloudevent";
import { EmitterFunction, HTTPEmitterFunction } from "./emitter";
import { HTTPTransportError } from "./http";
import { signalFromOptions } from "./signal";

/** Information about the failed send being considered for another attempt */
export interface RetryContext {
  /** The one-based number of the attempt that just failed */
  attempt: number;
  /** The maximum number of attempts, including the first send */
  maxAttempts: number;
}

/** Options applied by {@linkcode withRetry} to every event sent through its emitter */
export interface RetryOptions {
  /** Maximum number of attempts, including the first send; defaults to 5 */
  maxAttempts?: number;
  /** Decides whether an error should be retried; defaults to {@linkcode isRetryableHTTPError} */
  shouldRetry?: (error: unknown, context: RetryContext) => boolean;
  /**
   * Returns the delay before the next attempt in milliseconds; defaults to
   * {@linkcode defaultRetryDelay}
   */
  retryDelay?: (error: unknown, context: RetryContext) => number;
  /**
   * The longest a single wait may last in milliseconds, applied to whatever `retryDelay`
   * returns, so a sink cannot park an emitter with a distant `Retry-After`; defaults to 30
   * seconds. Pass `Number.POSITIVE_INFINITY` to wait for however long a delay asks
   */
  maxRetryDelay?: number;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_MAX_RETRY_DELAY = 30_000;
const MAX_TIMER_DELAY = 2_147_483_647;
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRY_AFTER_STATUSES = new Set([429, 503]);

/**
 * Decide whether the built-in HTTP transport reported a failure which is commonly temporary.
 * Network failures and HTTP 408, 425, 429, 500, 502, 503 and 504 are retried. Aborts, other
 * status codes and errors from custom transports are not.
 *
 * @param {unknown} error the error reported by an emitter
 * @returns {boolean} whether another HTTP send may succeed
 */
export function isRetryableHTTPError(error: unknown): boolean {
  if (error instanceof HTTPTransportError && error.kind === "network") {
    return true;
  }
  const response = httpStatusResponse(error);
  return response !== undefined && RETRYABLE_HTTP_STATUSES.has(response.status);
}

/**
 * Return the default delay before another send. A valid `Retry-After` header on HTTP 429 or
 * 503 takes precedence. Other failures wait `300 ms * 2 ** attempt`, scaled by a random factor
 * between 0.4 and 1.4: about 600 ms, 1.2 s, 2.4 s and 4.8 s before attempts two through five.
 *
 * What a caller waits is also bounded by `maxRetryDelay`, which {@linkcode withRetry} applies
 * to whatever this function returns.
 *
 * @param {unknown} error the error reported by an emitter
 * @param {RetryContext} context the failed attempt and configured limit
 * @returns {number} delay before the next attempt in milliseconds
 */
export function defaultRetryDelay(error: unknown, context: RetryContext): number {
  const retryAfter = retryAfterDelay(error);
  if (retryAfter !== undefined) {
    return retryAfter;
  }

  const exponentialDelay = 300 * 2 ** Math.min(context.attempt, context.maxAttempts);
  return Math.floor((Math.random() + 0.4) * exponentialDelay);
}

/**
 * Add retry behavior to an emitter backed by the built-in HTTP transport. Per-send response
 * handlers retain the response body type they return.
 *
 * @param {HTTPEmitterFunction} emitter the emitter to invoke for every attempt
 * @param {RetryOptions} options attempt limit, error predicate, delay policy and delay ceiling
 * @returns {HTTPEmitterFunction} an emitter with the same call signatures and retry behavior
 */
export function withRetry<TBody>(
  emitter: HTTPEmitterFunction<TBody>, options?: RetryOptions,
): HTTPEmitterFunction<TBody>;
/**
 * Add retry behavior to any {@linkcode EmitterFunction}. The same CloudEvent and send options
 * are passed to every attempt. Errors from custom transports require a custom `shouldRetry`
 * callback because the default predicate only recognizes `HTTPTransportError`.
 *
 * @param {EmitterFunction} emitter the emitter to invoke for every attempt
 * @param {RetryOptions} options attempt limit, error predicate, delay policy and delay ceiling
 * @returns {EmitterFunction} an emitter with the same result and option types
 */
export function withRetry<TResult, TOptions>(
  emitter: EmitterFunction<TResult, TOptions>, options?: RetryOptions,
): EmitterFunction<TResult, TOptions>;
export function withRetry<TResult, TOptions>(
  emitter: EmitterFunction<TResult, TOptions>, options: RetryOptions = {},
): EmitterFunction<TResult, TOptions> {
  if (typeof emitter !== "function") {
    throw new TypeError("An EmitterFunction is required");
  }

  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError("options.maxAttempts must be a positive integer");
  }
  const shouldRetry = options.shouldRetry ?? isRetryableHTTPError;
  if (typeof shouldRetry !== "function") {
    throw new TypeError("options.shouldRetry must be a function");
  }

  const retryDelay = options.retryDelay ?? defaultRetryDelay;
  if (typeof retryDelay !== "function") {
    throw new TypeError("options.retryDelay must be a function");
  }

  const maxRetryDelay = options.maxRetryDelay ?? DEFAULT_MAX_RETRY_DELAY;
  if (typeof maxRetryDelay !== "number" || Number.isNaN(maxRetryDelay) || maxRetryDelay < 0) {
    throw new TypeError("options.maxRetryDelay must be a non-negative number");
  }

  return async function emitWithRetry<T>(event: CloudEvent<T>, sendOptions?: TOptions): Promise<TResult> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await emitter(event, sendOptions);
      } catch (error) {
        const context = { attempt, maxAttempts };
        if (attempt >= maxAttempts || !shouldRetry(error, context)) {
          throw error;
        }

        const delay = retryDelay(error, context);
        if (!Number.isFinite(delay) || delay < 0) {
          throw new TypeError("options.retryDelay must return a finite, non-negative number");
        }
        await wait(Math.min(delay, maxRetryDelay), signalFromOptions(sendOptions));
      }
    }
  };
}

/**
 * Read the response a sink sent, for the failures which carry one
 *
 * @param {unknown} error the error which may carry an HTTP response
 * @returns {Response|undefined} the response, or undefined for any other failure
 */
function httpStatusResponse(error: unknown): Response | undefined {
  return error instanceof HTTPTransportError && error.kind === "http-status"
    ? error.response
    : undefined;
}

/**
 * Read Retry-After for a status where the built-in retry policy uses it
 *
 * @param {unknown} error the error which may carry an HTTP response
 * @returns {number|undefined} the requested delay, or undefined when there is none
 */
function retryAfterDelay(error: unknown): number | undefined {
  const response = httpStatusResponse(error);
  if (response === undefined || !RETRY_AFTER_STATUSES.has(response.status)) {
    return undefined;
  }

  const value = response.headers.get("retry-after")?.trim();
  if (!value) {
    return undefined;
  }
  if (/^\d+$/.test(value)) {
    const milliseconds = Number(value) * 1000;
    return Number.isFinite(milliseconds) ? milliseconds : undefined;
  }

  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? undefined : Math.max(0, retryAt - Date.now());
}

/**
 * Wait without retaining an AbortSignal after the timer settles
 *
 * @param {number} milliseconds how long to wait
 * @param {AbortSignal} signal a signal which can end the wait early
 * @returns {Promise<void>} completion when the timer expires
 */
function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let remaining = milliseconds;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const removeAbortListener = (): void => signal?.removeEventListener("abort", abort);
    const schedule = (): void => {
      const scheduled = Math.min(remaining, MAX_TIMER_DELAY);
      timeout = setTimeout(() => {
        remaining -= scheduled;
        if (remaining > 0) {
          schedule();
        } else {
          removeAbortListener();
          resolve();
        }
      }, scheduled);
    };
    const abort = (): void => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      removeAbortListener();
      reject(signal?.reason ?? abortError());
    };

    if (signal !== undefined) {
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) {
        abort();
        return;
      }
    }
    schedule();
  });
}

/**
 * Provide a standard-looking reason for implementations whose aborted signal has none
 *
 * @returns {Error} an AbortError suitable as a rejection reason
 */
function abortError(): Error {
  const error = new Error("Retry was aborted");
  error.name = "AbortError";
  return error;
}
