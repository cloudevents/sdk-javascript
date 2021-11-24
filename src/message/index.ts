/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { IncomingHttpHeaders } from "http";
import { CloudEvent } from "..";
import { binary, deserialize, structured, isEvent } from "./http";

/**
 * Binding is an interface for transport protocols to implement,
 * which provides functions for sending CloudEvent Messages over
 * the wire.
 * @interface
 *
 * @property {@link Serializer} `binary`     - converts a CloudEvent into a Message in binary mode
 * @property {@link Serializer} `structured` - converts a CloudEvent into a Message in structured mode
 * @property {@link Deserializer} `toEvent`  - converts a Message into a CloudEvent
 * @property {@link Detector} `isEvent`      - determines if a Message can be converted to a CloudEvent
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
 * @interface
 */
export interface Headers extends IncomingHttpHeaders {
  [key: string]: string | string[] | undefined;
}

/**
 * Message is an interface representing a CloudEvent as a
 * transport-agnostic message
 * @interface
 * @property {@linkcode Headers} `headers` - the headers for the event Message
 * @property string `body` - the body of the event Message
 */
export interface Message {
  headers: Headers;
  body: string | unknown;
}

/**
 * An enum representing the two transport modes, binary and structured
 * @interface
 */
export enum Mode {
  BINARY = "binary",
  STRUCTURED = "structured",
  BATCH = "batch",
}

/**
 * Serializer is an interface for functions that can convert a
 * CloudEvent into a Message.
 * @interface
 */
export interface Serializer {
  <T>(event: CloudEvent<T>): Message;
}

/**
 * Deserializer is a function interface that converts a
 * Message to a CloudEvent
 * @interface
 */
export interface Deserializer {
  <T>(message: Message): CloudEvent<T>;
}

/**
 * Detector is a function interface that detects whether
 * a message contains a valid CloudEvent
 * @interface
 */
export interface Detector {
  (message: Message): boolean;
}

/**
 * Bindings for HTTP transport support
 * @implements {@linkcode Binding}
 */
export const HTTP: Binding = {
  binary: binary as Serializer,
  structured: structured as Serializer,
  toEvent: deserialize as Deserializer,
  isEvent: isEvent as Detector,
};
