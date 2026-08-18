/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";

import {
  EmitterFunction, HTTPTransportError, HTTPTransportResponse, emitterFor, httpTransport,
  withRetry, withTimeout,
} from "../../src";
import { fixture } from "./emitter_factory_test";
import { withServer } from "./http_transport_test";

interface TestSendOptions {
  label?: string;
  signal?: AbortSignal;
}

describe("withTimeout()", () => {
  it("Aborts a built-in HTTP send after its timeout", async () => {
    await withServer(() => undefined, async (url) => {
      const emit = withTimeout(emitterFor(httpTransport(url)), 50);
      const error = await errorFrom(emit(fixture));

      expect(error).to.be.instanceOf(HTTPTransportError);
      expect((error as HTTPTransportError).kind).to.equal("aborted");
      expect(((error as HTTPTransportError).cause as Error)?.name).to.equal("TimeoutError");
    });
  });

  it("Combines a caller's signal with the timeout and preserves other send options", async () => {
    const controller = new AbortController();
    const reason = new Error("caller stopped delivery");
    let received: TestSendOptions | undefined;
    const emitter: EmitterFunction<void, TestSendOptions> = async (_event, options) => {
      received = options;
      const signal = options?.signal;
      if (!signal) {
        throw new Error("expected a timeout signal");
      }
      await new Promise<void>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
    };
    const emit = withTimeout(emitter, 10_000);
    const sendOptions = { label: "order-123", signal: controller.signal };

    const emitted = emit(fixture, sendOptions);
    controller.abort(reason);

    expect(await errorFrom(emitted)).to.equal(reason);
    expect(received?.label).to.equal("order-123");
    expect(received?.signal).not.to.equal(controller.signal);
    expect(sendOptions.signal).to.equal(controller.signal);
  });

  it("Starts a fresh timeout for every retry attempt when wrapped inside withRetry", async () => {
    const signals: Array<AbortSignal | undefined> = [];
    let attempts = 0;
    const emitter: EmitterFunction<string, TestSendOptions> = async (_event, options) => {
      signals.push(options?.signal);
      if (attempts++ === 0) {
        throw new HTTPTransportError("network");
      }
      return "accepted";
    };
    const emit = withRetry(withTimeout(emitter, 10_000), { retryDelay: () => 0 });

    expect(await emit(fixture)).to.equal("accepted");
    expect(signals).to.have.length(2);
    expect(signals[0]).not.to.equal(undefined);
    expect(signals[1]).not.to.equal(signals[0]);
  });

  it("Validates its emitter and timeout", () => {
    const emitter: EmitterFunction<void> = async () => undefined;

    expect(() => withTimeout(undefined as unknown as EmitterFunction<void>, 100)).to.throw(
      TypeError, "An EmitterFunction is required",
    );
    for (const timeout of [-1, 1.5, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(() => withTimeout(emitter, timeout), `${timeout}`).to.throw(
        TypeError, "timeoutMs must be a non-negative safe integer",
      );
    }
    for (const timeout of [2_147_483_648, Number.MAX_SAFE_INTEGER]) {
      expect(() => withTimeout(emitter, timeout), `${timeout}`).to.throw(
        RangeError, "timeoutMs cannot be greater than 2147483647",
      );
    }
    expect(() => withTimeout(emitter, 0)).not.to.throw();
    expect(() => withTimeout(emitter, 2_147_483_647)).not.to.throw();
  });

  it("Keeps the built-in HTTP emitter's per-send response type", () => {
    const emit = withTimeout(
      emitterFor(httpTransport("https://events.example.com/orders")),
      1000,
    );
    const inferred = () => emit(fixture, {
      responseHandler: async () => ({ accepted: true }),
    });
    const typed: () => Promise<HTTPTransportResponse<{ accepted: boolean }>> = inferred;

    expect(typed).to.be.a("function");
  });
});

async function errorFrom(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the promise to reject");
}
