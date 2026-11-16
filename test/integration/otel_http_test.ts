/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { execFile } from "child_process";
import { join } from "path";
import { promisify } from "util";

const run = promisify(execFile);

describe("CloudEventPropagator with HTTP instrumentation", function() {
  this.timeout(20000);

  const cases = {
    creation: "Uses the CloudEvents creation context as the HTTP server span's parent",
    transport: "Prefers the HTTP transport context over the event's creation context",
    fallback: "Falls back to CloudEvents when the HTTP traceparent is invalid",
    structured: "Extracts a structured event's context after decoding its body",
    send: "Propagates the active send context while retaining the event's creation context",
  };
  for (const [scenario, description] of Object.entries(cases)) {
    it(description, async () => {
      // Isolate module hooks and global OTel registration from the other integration tests.
      await run(process.execPath, [
        "--require", require.resolve("ts-node/register"),
        join(__dirname, "../fixtures/otel_http.ts"), scenario,
      ], { timeout: 15000 });
    });
  }
});
