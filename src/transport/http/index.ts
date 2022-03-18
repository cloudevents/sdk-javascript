/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Socket } from "net";
import http, { OutgoingHttpHeaders } from "http";
import https, { RequestOptions } from "https";

import { Message, Options } from "../..";
import { TransportFunction } from "../emitter";

/**
 * httpTransport provides a simple HTTP Transport function, which can send a CloudEvent,
 * encoded as a Message to the endpoint. The returned function can be used with emitterFor()
 * to provide an event emitter, for example:
 * 
 * const emitter = emitterFor(httpTransport("http://example.com"));
 * emitter.emit(myCloudEvent)
 *    .then(resp => console.log(resp));
 * 
 * @param {string|URL} sink the destination endpoint for the event
 * @returns {TransportFunction} a function which can be used to send CloudEvents to _sink_
 */
export function httpTransport(sink: string | URL): TransportFunction {
  const url = new URL(sink);
  let base: any;
  if (url.protocol === "https:") {
    base = https;
  } else if (url.protocol === "http:") {
    base = http;
  } else {
    throw new TypeError(`unsupported protocol ${url.protocol}`);
  }
  return function(message: Message, options?: Options): Promise<unknown> {
    return new Promise((resolve, reject) => {
      options = { ...options };

      // TODO: Callers should be able to set any Node.js RequestOptions
      const opts: RequestOptions = {
        method: "POST",
        headers: {...message.headers, ...options.headers as OutgoingHttpHeaders},
      };
      try {
        const response = {
          body: "",
          headers: {},
        };
        const req = base.request(url, opts, (res: Socket) => {
          res.setEncoding("utf-8");
          response.headers = (res as any).headers;
          res.on("data", (chunk) => response.body += chunk);
          res.on("end", () => { resolve(response); });
        });
        req.on("error", reject);
        req.write(message.body);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  };
}
