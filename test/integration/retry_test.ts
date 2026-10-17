/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";

import {
  EmitterFunction, HTTPTransportError, HTTPTransportResponse, RetryContext, RetryOptions,
  defaultRetryDelay, emitterFor, httpTransport, isRetryableHTTPError, withRetry,
} from "../../src";
import { fixture } from "./emitter_factory_test";
import { withServer } from "./http_transport_test";

interface TestSendOptions {
  label?: string;
  signal?: AbortSignal;
}

describe("withRetry()", () => {
  it("Retries the same event and send options until the emitter succeeds", async () => {
    const networkError = new HTTPTransportError("network", { cause: new Error("connection reset") });
    const events: unknown[] = [];
    const options: unknown[] = [];
    const contexts: RetryContext[] = [];
    let attempts = 0;
    const emitter: EmitterFunction<string, TestSendOptions> = async (event, sendOptions) => {
      attempts++;
      events.push(event);
      options.push(sendOptions);
      if (attempts < 3) {
        throw networkError;
      }
      return "accepted";
    };
    const emit = withRetry(emitter, {
      maxAttempts: 3,
      retryDelay: (_error, context) => {
        contexts.push(context);
        return 0;
      },
    });
    const sendOptions = { label: "order-123" };

    expect(await emit(fixture, sendOptions)).to.equal("accepted");
    expect(attempts).to.equal(3);
    expect(events).to.deep.equal([fixture, fixture, fixture]);
    expect(options).to.deep.equal([sendOptions, sendOptions, sendOptions]);
    expect(contexts).to.deep.equal([
      { attempt: 1, maxAttempts: 3 },
      { attempt: 2, maxAttempts: 3 },
    ]);
  });

  it("Defaults to five total attempts and throws the final error unchanged", async () => {
    const errors = Array.from({ length: 5 }, (_, index) => new Error(`failure ${index + 1}`));
    let attempts = 0;
    const emitter: EmitterFunction<void> = async () => {
      throw errors[attempts++];
    };
    const emit = withRetry(emitter, {
      shouldRetry: () => true,
      retryDelay: () => 0,
    });

    expect(await errorFrom(emit(fixture))).to.equal(errors[4]);
    expect(attempts).to.equal(5);
  });

  it("Allows a custom predicate to retry errors from a custom transport", async () => {
    const transient = new Error("broker is busy");
    const seen: Array<{ error: unknown; context: RetryContext }> = [];
    const emit = withRetry(failsOnce(transient), {
      shouldRetry: (error, context) => {
        seen.push({ error, context });
        return error === transient;
      },
      retryDelay: () => 0,
    });

    expect(await emit(fixture)).to.equal("accepted");
    expect(seen).to.deep.equal([{
      error: transient,
      context: { attempt: 1, maxAttempts: 5 },
    }]);
  });

  it("Sends once when maxAttempts is 1", async () => {
    let attempts = 0;
    const emitter: EmitterFunction<void> = async () => {
      attempts++;
      throw new HTTPTransportError("network");
    };
    const emit = withRetry(emitter, { maxAttempts: 1, retryDelay: () => 0 });

    expect(await errorFrom(emit(fixture))).to.be.instanceOf(HTTPTransportError);
    expect(attempts).to.equal(1);
  });

  it("Retries a 503 from the built-in HTTP transport until the sink accepts the event", async () => {
    const statuses = [503, 202];
    let requestCount = 0;

    await withServer((_request, response) => {
      response.writeHead(statuses[requestCount++] ?? 500);
      response.end();
    }, async (url) => {
      const emit = withRetry(emitterFor(httpTransport(url)), { retryDelay: () => 0 });
      const { response } = await emit(fixture);

      expect(response.status).to.equal(202);
      expect(requestCount).to.equal(2);
    });
  });

  it("Does not retry a 400 from the built-in HTTP transport", async () => {
    let requestCount = 0;

    await withServer((_request, response) => {
      requestCount++;
      response.writeHead(400);
      response.end();
    }, async (url) => {
      const emit = withRetry(emitterFor(httpTransport(url)), { retryDelay: () => 0 });
      const error = await errorFrom(emit(fixture));

      expect(error).to.be.instanceOf(HTTPTransportError);
      expect((error as HTTPTransportError).response?.status).to.equal(400);
      expect(requestCount).to.equal(1);
    });
  });

  it("Stops during backoff when the per-send signal aborts", async () => {
    const controller = new AbortController();
    const reason = new Error("delivery deadline reached");
    let attempts = 0;
    const emitter: EmitterFunction<void, TestSendOptions> = async () => {
      attempts++;
      throw new HTTPTransportError("network");
    };
    const emit = withRetry(emitter, { retryDelay: () => 10_000 });

    const emitted = emit(fixture, { signal: controller.signal });
    setTimeout(() => controller.abort(reason), 10);

    expect(await errorFrom(emitted)).to.equal(reason);
    expect(attempts).to.equal(1);
  });

  it("Splits delays which exceed the JavaScript timer limit", async () => {
    const maximumTimerDelay = 2_147_483_647;

    const scheduled = await recordedTimerDelays(async () => {
      const emit = withRetry(failsOnce(new HTTPTransportError("network")), {
        retryDelay: () => maximumTimerDelay + 1,
        // the delay ceiling would otherwise keep this within a single timer
        maxRetryDelay: Number.POSITIVE_INFINITY,
      });
      expect(await emit(fixture)).to.equal("accepted");
    });

    expect(scheduled).to.deep.equal([maximumTimerDelay, 1]);
  });

  it("Bounds what a sink asks for with maxRetryDelay", async () => {
    // a sink which asks for a day before the next attempt
    const asksForADay = httpStatusError(503, "86400");

    const byDefault = await recordedTimerDelays(async () => {
      expect(await withRetry(failsOnce(asksForADay))(fixture)).to.equal("accepted");
    });
    const configured = await recordedTimerDelays(async () => {
      expect(await withRetry(failsOnce(asksForADay), { maxRetryDelay: 5_000 })(fixture))
        .to.equal("accepted");
    });

    expect(byDefault).to.deep.equal([30_000]);
    expect(configured).to.deep.equal([5_000]);
  });

  it("Validates retry configuration and callback results", async () => {
    const emitter: EmitterFunction<void> = async () => {
      throw new HTTPTransportError("network");
    };

    expect(() => withRetry(emitter, { maxAttempts: 0 })).to.throw(
      TypeError, "options.maxAttempts must be a positive integer",
    );
    expect(() => withRetry(emitter, {
      shouldRetry: "yes" as unknown as RetryOptions["shouldRetry"],
    })).to.throw(TypeError, "options.shouldRetry must be a function");
    expect(() => withRetry(emitter, {
      retryDelay: 100 as unknown as RetryOptions["retryDelay"],
    })).to.throw(TypeError, "options.retryDelay must be a function");
    expect(() => withRetry(emitter, { maxRetryDelay: -1 })).to.throw(
      TypeError, "options.maxRetryDelay must be a non-negative number",
    );
    expect(() => withRetry(emitter, { maxRetryDelay: Number.POSITIVE_INFINITY })).not.to.throw();

    const emit = withRetry(emitter, { retryDelay: () => Number.POSITIVE_INFINITY });
    expect(await errorFrom(emit(fixture))).to.be.instanceOf(TypeError);
  });

  it("Keeps the built-in HTTP emitter's per-send response type", () => {
    const emit = withRetry(emitterFor(httpTransport("https://events.example.com/orders")));
    const inferred = () => emit(fixture, {
      responseHandler: async () => ({ accepted: true }),
    });
    const typed: () => Promise<HTTPTransportResponse<{ accepted: boolean }>> = inferred;

    expect(typed).to.be.a("function");
  });
});

describe("isRetryableHTTPError()", () => {
  it("Retries network failures and temporary HTTP statuses", () => {
    expect(isRetryableHTTPError(new HTTPTransportError("network"))).to.equal(true);

    for (const status of [408, 425, 429, 500, 502, 503, 504]) {
      expect(isRetryableHTTPError(httpStatusError(status)), `${status}`).to.equal(true);
    }
  });

  it("Does not retry aborts, permanent statuses or unknown errors", () => {
    expect(isRetryableHTTPError(new HTTPTransportError("aborted"))).to.equal(false);
    expect(isRetryableHTTPError(httpStatusError(400))).to.equal(false);
    expect(isRetryableHTTPError(httpStatusError(501))).to.equal(false);
    expect(isRetryableHTTPError(new Error("custom transport failed"))).to.equal(false);
  });
});

describe("defaultRetryDelay()", () => {
  it("Uses the exponential schedule with randomized jitter", () => {
    withRandom(0.5, () => {
      expect(defaultRetryDelay(new Error("temporary"), context(1))).to.equal(540);
      expect(defaultRetryDelay(new Error("temporary"), context(2))).to.equal(1080);
      expect(defaultRetryDelay(new Error("temporary"), context(3))).to.equal(2160);
      expect(defaultRetryDelay(new Error("temporary"), context(4))).to.equal(4320);
    });
  });

  it("Caps the exponential schedule at maxAttempts", () => {
    withRandom(0.5, () => {
      expect(defaultRetryDelay(new Error("temporary"), {
        attempt: 6,
        maxAttempts: 5,
      })).to.equal(8640);
    });
  });

  it("Uses Retry-After seconds for 429 and 503", () => {
    expect(defaultRetryDelay(httpStatusError(429, "3"), context(1))).to.equal(3000);
    expect(defaultRetryDelay(httpStatusError(503, "0"), context(2))).to.equal(0);
  });

  it("Uses a future Retry-After HTTP date", () => {
    const now = Date.UTC(2026, 7, 17, 12, 0, 0);
    withNow(now, () => {
      const retryAt = new Date(now + 5000).toUTCString();
      expect(defaultRetryDelay(httpStatusError(503, retryAt), context(1))).to.equal(5000);
    });
  });

  it("Falls back to exponential delay for invalid or inapplicable Retry-After headers", () => {
    withRandom(0.5, () => {
      expect(defaultRetryDelay(httpStatusError(429, "later"), context(1))).to.equal(540);
      expect(defaultRetryDelay(httpStatusError(500, "3"), context(1))).to.equal(540);
    });
  });

  it("Allows a custom retryDelay to replace Retry-After handling", async () => {
    const error = httpStatusError(503, "120");
    let delayError: unknown;
    const emit = withRetry(failsOnce(error), {
      retryDelay: (received) => {
        delayError = received;
        return 0;
      },
    });

    expect(await emit(fixture)).to.equal("accepted");
    expect(delayError).to.equal(error);
  });
});

// Record what withRetry() asks a timer for, without waiting for it.
async function recordedTimerDelays(run: () => Promise<void>): Promise<number[]> {
  const scheduled: number[] = [];
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((callback: (...args: unknown[]) => void, milliseconds?: number) => {
    scheduled.push(milliseconds ?? 0);
    return originalSetTimeout(callback, 0);
  }) as typeof setTimeout;

  try {
    await run();
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
  return scheduled;
}

// Run with Math.random() pinned, so the jittered delays are exact.
function withRandom<T>(value: number, run: () => T): T {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return run();
  } finally {
    Math.random = originalRandom;
  }
}

// Run with Date.now() pinned, so a Retry-After date resolves to an exact delay.
function withNow<T>(now: number, run: () => T): T {
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    return run();
  } finally {
    Date.now = originalNow;
  }
}

// An emitter which throws once, then accepts the event.
function failsOnce(error: unknown): EmitterFunction<string> {
  let attempts = 0;
  return async () => {
    if (attempts++ === 0) {
      throw error;
    }
    return "accepted";
  };
}

function context(attempt: number): RetryContext {
  return { attempt, maxAttempts: 5 };
}

function httpStatusError(status: number, retryAfter?: string): HTTPTransportError {
  const headers = retryAfter === undefined ? undefined : { "retry-after": retryAfter };
  return new HTTPTransportError("http-status", {
    response: new Response(null, { status, headers }),
  });
}

async function errorFrom(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the promise to reject");
}
