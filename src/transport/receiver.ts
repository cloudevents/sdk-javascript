import { Headers, Message, HTTP } from "../message";
import { sanitize } from "../message/http/headers";
import { CloudEvent } from "..";

/**
 * A class to receive a CloudEvent from an HTTP POST request.
 */
export const Receiver = {
  /**
   * Acceptor for an incoming HTTP CloudEvent POST. Can process
   * binary and structured incoming CloudEvents.
   *
   * @param {Object} headers HTTP headers keyed by header name ("Content-Type")
   * @param {Object|JSON} body The body of the HTTP request
   * @return {CloudEvent} A new {CloudEvent} instance
   * @deprecated Will be removed in 4.0.0. Consider using the Message interface with HTTP.toEvent(message)
   */
  accept(headers: Headers, body: string | Record<string, unknown> | undefined | null): CloudEvent {
    const cleanHeaders: Headers = sanitize(headers);
    const cleanBody = body ? (typeof body === "object" ? JSON.stringify(body) : body) : undefined;
    const message: Message = {
      headers: cleanHeaders,
      body: cleanBody,
    };
    return HTTP.toEvent(message);
  },
};
