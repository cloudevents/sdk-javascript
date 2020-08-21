import { Headers, Message, HTTP } from "../messages";
import { sanitize } from "../messages/http/headers";
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
   */
  accept(headers: Headers, body: string | Record<string, unknown> | undefined | null): CloudEvent {
    const cleanHeaders: Headers = sanitize(headers);
    const cleanBody = body ? (typeof body === "object" ? JSON.stringify(body) : body) : "";
    const message: Message = {
      headers: cleanHeaders,
      body: cleanBody,
    };
    return HTTP.toEvent(message);
  },
};
