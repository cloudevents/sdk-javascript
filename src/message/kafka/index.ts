/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEvent, CloudEventV1, CONSTANTS, Mode, ValidationError } from "../..";
import { Message, Headers, Binding } from "..";
import { headersFor, HEADER_MAP, KAFKA_CE_HEADERS } from "./headers";
import { sanitize } from "../http/headers";

// Export the binding implementation and message interface
export {
  Kafka
};

export type {
  KafkaMessage,
  KafkaEvent
};

/**
 * Bindings for Kafka transport
 * @implements {@linkcode Binding}
 */
 const Kafka: Binding = {
  binary: toBinaryKafkaMessage,
  structured: toStructuredKafkaMessage,
  toEvent: deserializeKafkaMessage,
  isEvent: isKafkaEvent,
};

type Key = string | Buffer;

/**
 * Extends the base Message type to include
 * Kafka-specific fields
 */
interface KafkaMessage<T = string> extends Message {
  key: Key
  value: T | string | Buffer | unknown
  timestamp?: string
}

/**
 * Extends the base CloudEventV1 interface to include a `partitionkey` field
 * which is explicitly mapped to KafkaMessage#key
 */
interface KafkaEvent<T> extends CloudEventV1<T> {
  /**
   * Maps to KafkaMessage#key per
   * https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#31-key-mapping
   */
  partitionkey: Key
}

/**
 * Serialize a CloudEvent for Kafka in binary mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#32-binary-content-mode
 *
 * @param {KafkaEvent<T>} event The event to serialize
 * @returns {KafkaMessage<T>} a KafkaMessage instance
 */
function toBinaryKafkaMessage<T>(event: CloudEventV1<T>): KafkaMessage<T> {
  // 3.2.1. Content Type
  // For the binary mode, the header content-type property MUST be mapped directly
  // to the CloudEvents datacontenttype attribute.
  const headers: Headers = { 
    ...{ [CONSTANTS.HEADER_CONTENT_TYPE]: event.datacontenttype }, 
    ...headersFor(event)
  };
  return {
    headers,
    key: event.partitionkey as Key,
    value: event.data,
    body: event.data,
    timestamp: timestamp(event.time)
  };
}

/**
 * Serialize a CloudEvent for Kafka in structured mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#33-structured-content-mode
 *
 * @param {CloudEvent<T>} event the CloudEvent to be serialized
 * @returns {KafkaMessage<T>} a KafkaMessage instance
 */
 function toStructuredKafkaMessage<T>(event: CloudEventV1<T>): KafkaMessage<T> {
  if ((event instanceof CloudEvent) && event.data_base64) {
    // The event's data is binary - delete it
    event = event.cloneWith({ data: undefined });
  }
  const value = event.toString();
  return {
    // All events may not have a partitionkey set, but if they do,
    // use it for the KafkaMessage#key per
    // https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#31-key-mapping
    key: event.partitionkey as Key,
    value,
    headers: {
      [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
    },
    body: value,
    timestamp: timestamp(event.time)
  };
}

/**
 * Converts a Message to a CloudEvent
 * @implements {Deserializer}
 *
 * @param {Message} message the incoming message
 * @return {KafkaEvent} A new {KafkaEvent} instance
 */
function deserializeKafkaMessage<T>(message: Message): CloudEvent<T> | CloudEvent<T>[] {
  if (!isKafkaEvent(message)) {
    throw new ValidationError("No CloudEvent detected");
  }
  const m = message as KafkaMessage<T>;
  if (!m.value) {
    throw new ValidationError("Value is null or undefined");
  }
  if (!m.headers) {
    throw new ValidationError("Headers are null or undefined");
  }
  const cleanHeaders: Headers = sanitize(m.headers);
  const mode: Mode = getMode(cleanHeaders);
  switch (mode) {
    case Mode.BINARY:
      return parseBinary(m);
    case Mode.STRUCTURED:
      return parseStructured(m);
    case Mode.BATCH:
      return parseBatched(m);
    default:
      throw new ValidationError("Unknown Message mode");
  }
}

/**
 * Determine if a Message is a CloudEvent via Kafka headers
 * @implements {Detector}
 *
 * @param {Message} message an incoming Message object
 * @returns {boolean} true if this Message is a CloudEvent
 */
function isKafkaEvent(message: Message): boolean {
   const headers = sanitize(message.headers);
   return !!headers[KAFKA_CE_HEADERS.ID] || // A binary mode event
    headers[CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(CONSTANTS.MIME_CE) as boolean || // A structured mode event
    headers[CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(CONSTANTS.MIME_CE_BATCH) as boolean; // A batch of events
}

/**
 * Determines what content mode a Kafka message is in given the provided headers
 * @param {Headers} headers the headers
 * @returns {Mode} the content mode of the KafkaMessage
 */
function getMode(headers: Headers): Mode {
  const contentType = headers[CONSTANTS.HEADER_CONTENT_TYPE];
  if (contentType) {
    if (contentType.startsWith(CONSTANTS.MIME_CE_BATCH)) {
      return Mode.BATCH;
    } else if (contentType.startsWith(CONSTANTS.MIME_CE)) {
      return Mode.STRUCTURED;
    }
  }
  return Mode.BINARY;
}

/**
 * Parses a binary kafka CE message and returns a CloudEvent
 * @param {KafkaMessage} message the message
 * @returns {CloudEvent<T>} a CloudEvent<T>
 */
function parseBinary<T>(message: KafkaMessage<T>): CloudEvent<T> {
  const eventObj: { [key: string ]: unknown } = {};
  const headers = { ...message.headers };

  eventObj.datacontenttype = headers[CONSTANTS.HEADER_CONTENT_TYPE];

  for (const key in KAFKA_CE_HEADERS) {
    const h = KAFKA_CE_HEADERS[key];
    if (!!headers[h]) {
      eventObj[HEADER_MAP[h]] = headers[h];
      if (h === KAFKA_CE_HEADERS.TIME) {
        eventObj.time = new Date(eventObj.time as string).toISOString();
      }
      delete headers[h];
    }
  }

  // Any remaining headers are extension attributes
  // TODO: The spec is unlear on whether these should
  // be prefixed with 'ce_' as headers. We assume it is
  for (const key in headers) {
    if (key.startsWith("ce_")) {
      eventObj[key.replace("ce_", "")] = headers[key];
    }
  }

  return new CloudEvent<T>({
    ...eventObj,
    data: extractBinaryData(message),
    partitionkey: message.key,
  }, false);
}

/**
 * Parses a structured kafka CE message and returns a CloudEvent
 * @param {KafkaMessage<T>} message the message
 * @returns {CloudEvent<T>} a KafkaEvent<T>
 */
function parseStructured<T>(message: KafkaMessage<T>): CloudEvent<T> {
  // Although the format of a structured encoded event could be something
  // other than JSON, e.g. XML, we currently only support JSON
  // encoded structured events.
  if (!message.headers[CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(CONSTANTS.MIME_CE_JSON)) {
    throw new ValidationError(`Unsupported event encoding ${message.headers[CONSTANTS.HEADER_CONTENT_TYPE]}`);
  }
  const eventObj = JSON.parse(message.value as string);
  eventObj.time = new Date(eventObj.time).toISOString();
  return new CloudEvent({
    ...eventObj,
    partitionkey: message.key,
  }, false);
}

/**
 * Parses a batch kafka CE message and returns a CloudEvent[]
 * @param {KafkaMessage<T>} message the message
 * @returns {CloudEvent<T>[]} an array of KafkaEvent<T>
 */
function parseBatched<T>(message: KafkaMessage<T>): CloudEvent<T>[] {
  // Although the format of batch encoded events could be something
  // other than JSON, e.g. XML, we currently only support JSON
  // encoded structured events.
  if (!message.headers[CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(CONSTANTS.MIME_CE_BATCH)) {
    throw new ValidationError(`Unsupported event encoding ${message.headers[CONSTANTS.HEADER_CONTENT_TYPE]}`);
  }
  const events = JSON.parse(message.value as string) as Record<string, unknown>[];
  return events.map((e) => new CloudEvent({ ...e, partitionkey: message.key }, false));
}

/**
 * Gets the data from a binary kafka ce message as T
 * @param {KafkaMessage} message a KafkaMessage
 * @returns {string | undefined} the data in the message
 */
function extractBinaryData<T>(message: KafkaMessage<T>): T {
  let data = message.value as T;
  // If the event data is JSON, go ahead and parse it
  const datacontenttype = message.headers[CONSTANTS.HEADER_CONTENT_TYPE] as string;
  if (!!datacontenttype && datacontenttype.startsWith(CONSTANTS.MIME_JSON)) {
    if (typeof message.value === "string") {
      data = JSON.parse(message.value);
    } else if (typeof message.value === "object" && Buffer.isBuffer(message.value)) {
      data = JSON.parse(message.value.toString());
    } 
  }
  return data;
}

/**
 * Converts a possible date string into a correctly formatted
 * (for CloudEvents) ISO date string.
 * @param {string | undefined} t a possible date string
 * @returns {string | undefined} a properly formatted ISO date string or undefined
 */
function timestamp(t: string|undefined): string | undefined {
  return !!t ? `${Date.parse(t)}` : undefined;
}
