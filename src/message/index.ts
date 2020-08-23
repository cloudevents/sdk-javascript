import { CloudEvent } from "..";
import { binary, deserialize, structured } from "./http";

/**
 * Binding is an interface for transport protocols to implement,
 * which provides functions for sending CloudEvent Messages over
 * the wire.
 */
export interface Binding {
  binary: Serializer;
  structured: Serializer;
  toEvent: Deserializer;
}

/**
 * Headers is an interface representing transport-agnostic headers as
 * key/value string pairs
 */
export interface Headers {
  [key: string]: string;
}

/**
 * Message is an interface representing a CloudEvent as a
 * transport-agnostic message
 */
export interface Message {
  headers: Headers;
  body: string;
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

// HTTP Message capabilities
export const HTTP: Binding = {
  binary: binary as Serializer,
  structured: structured as Serializer,
  toEvent: deserialize as Deserializer,
};
