/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";

import { emitterFor, HTTP, Mode, Message, Emitter } from "../../src";

import { fixture, assertStructured } from "./emitter_factory_test";

import { rejects, doesNotReject } from "assert";

describe("Emitter Singleton", () => {
  it("emit a Node.js 'cloudevent' event as an EventEmitter", async () => {
    const msg: Message | unknown = await new Promise((resolve) => {
      const fn = async (message: Message) => {
        resolve(message);
      };
      const emitter = emitterFor(fn, { binding: HTTP, mode: Mode.STRUCTURED });
      Emitter.on("cloudevent", emitter);

      fixture.emit(false);
    });
    let body: unknown = (msg as Message).body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    assertStructured({ ...(body as any), ...(msg as Message).headers });
  });

  it("emit a Node.js 'cloudevent' event as an EventEmitter with ensureDelivery", async () => {
    let msg: Message | unknown = undefined;
    const fn = async (message: Message) => {
      msg = message;
    };
    const emitter = emitterFor(fn, { binding: HTTP, mode: Mode.STRUCTURED });
    Emitter.on("cloudevent", emitter);
    await fixture.emit(true);
    let body: any = (msg as Message).body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    assertStructured({ ...(body as any), ...(msg as Message).headers });
  });

  it("emit a Node.js 'cloudevent' event as an EventEmitter with ensureDelivery Error", async () => {
    const emitter = async () => {
      throw new Error("Not sent");
    };
    Emitter.on("cloudevent", emitter);
    // Should fail with emitWithEnsureDelivery
    await rejects(() => fixture.emit(true));
    // Should not fail with emitWithEnsureDelivery
    // Work locally but not on Github Actions
    if (!process.env.GITHUB_WORKFLOW) {
      await doesNotReject(() => fixture.emit(false));
    }
  });
});
