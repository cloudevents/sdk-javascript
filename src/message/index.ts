import { IncomingHttpHeaders } from "http";
import { CloudEvent } from "..";
import { binary, deserialize, structured, isEvent } from "./http";

/**
 * Binding is an interface for transport protocols to implement,
 * which provides functions for sending CloudEvent Messages over
 * the wire.
 */
export interface Binding {
  binary: Serializer;
  structured: Serializer;
  toEvent: Deserializer;
  isEvent: Detector;
}

/**
 * Headers is an interface representing transport-agnostic headers as
 * key/value string pairs
 */
export interface Headers extends IncomingHttpHeaders {
  [key: string]: string | string[] | undefined;
}

/**
 * Message is an interface representing a CloudEvent as a
 * transport-agnostic message
 */
export interface Message {
  headers: Headers;
  body: string | unknown;
}

/**
 * An enum representing the two transport modes, binary and structured
 */
export enum Mode {
  BINARY = "binary",
  STRUCTURED = "structured",
}

/**
 * Serializer is an interface for functions that can convert a
 * CloudEvent into a Message.
 */
export interface Serializer {
  (event: CloudEvent): Message;
}

/**
 * Deserializer is a function interface that converts a
 * Message to a CloudEvent
 */
export interface Deserializer {
  (message: Message): CloudEvent;
}

/**
 * Detector is a function interface that detects whether
 * a message contains a valid CloudEvent
 */
export interface Detector {
  (message: Message): boolean;
}

// HTTP Message capabilities
export const HTTP: Binding = {
  binary: binary as Serializer,
  structured: structured as Serializer,
  toEvent: deserialize as Deserializer,
  isEvent: isEvent as Detector,
};
