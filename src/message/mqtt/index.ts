/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Binding, Deserializer, CloudEvent, CloudEventV1, CONSTANTS, Message, ValidationError, Headers } from "../..";
import { base64AsBinary } from "../../event/validation";

export {
  MQTT, MQTTMessageFactory
};
export type { MQTTMessage };

/**
 * Extends the base {@linkcode Message} interface to include MQTT attributes, some of which
 * are aliases of the {Message} attributes.
 */
interface MQTTMessage<T = unknown> extends Message<T> {
  /**
   * Identifies this message as a PUBLISH packet. MQTTMessages created with
   * the `binary` and `structured` Serializers will contain a "Content Type"
   * property in the PUBLISH record.
   * @see https://github.com/cloudevents/spec/blob/v1.0.1/mqtt-protocol-binding.md#3-mqtt-publish-message-mapping
   */
  PUBLISH: Record<string, string | undefined> | undefined
  /**
   * Alias of {Message#body}
   */
  payload: T | undefined,
  /**
   * Alias of {Message#headers}
   */
  "User Properties": Headers | undefined
}

/**
 * Binding for MQTT transport support
 * @implements @linkcode Binding
 */
const MQTT: Binding<MQTTMessage, MQTTMessage> = {
  binary,
  structured,
  toEvent: toEvent as Deserializer,
  isEvent
};

/**
 * Converts a CloudEvent into an MQTTMessage<T> with the event's data as the message payload
 * @param {CloudEventV1} event a CloudEvent 
 * @returns {MQTTMessage<T>} the event serialized as an MQTTMessage<T> with binary encoding
 * @implements {Serializer}
 */
function binary<T>(event: CloudEventV1<T>): MQTTMessage<T> {
  const properties = { ...event };

  let body = properties.data as T;

  if (!body && properties.data_base64) {
    body = base64AsBinary(properties.data_base64) as unknown as T;
  }

  delete properties.data;
  delete properties.data_base64;

  return MQTTMessageFactory(event.datacontenttype as string, properties, body);
}

/**
 * Converts a CloudEvent into an MQTTMessage<T> with the event as the message payload
 * @param {CloudEventV1} event a CloudEvent 
 * @returns {MQTTMessage<T>} the event serialized as an MQTTMessage<T> with structured encoding
 * @implements {Serializer}
 */
function structured<T>(event: CloudEventV1<T>): MQTTMessage<T> {
  let body;
  if (event instanceof CloudEvent) {
    body = event.toJSON();
  } else {
    body = event;
  }
  return MQTTMessageFactory(CONSTANTS.DEFAULT_CE_CONTENT_TYPE, {}, body) as MQTTMessage<T>;
}

/**
 * A helper function to create an MQTTMessage<T> object, with "User Properties" as an alias
 * for "headers" and "payload" an alias for body, and a "PUBLISH" record with a "Content Type"
 * property.
 * @param {string} contentType the "Content Type" attribute on PUBLISH
 * @param {Record<string, unknown>} headers the headers and "User Properties"
 * @param {T} body the message body/payload
 * @returns {MQTTMessage<T>} a message initialized with the provided attributes
 */
function MQTTMessageFactory<T>(contentType: string, headers: Record<string, unknown>, body: T): MQTTMessage<T> {
  return {
    PUBLISH: {
      "Content Type": contentType
    },
    body,
    get payload() {
      return this.body as T;
    },
    headers: headers as Headers,
    get "User Properties"() {
      return this.headers as any;
    }
  };
}

/**
 * Converts an MQTTMessage<T> into a CloudEvent
 * @param {Message<T>} message the message to deserialize
 * @param {boolean} strict determines if a ValidationError will be thrown on bad input - defaults to false
 * @returns {CloudEventV1<T>} an event
 * @implements {Deserializer}
 */
function toEvent<T>(message: Message<T>, strict = false): CloudEventV1<T> | CloudEventV1<T>[] {
  if (strict && !isEvent(message)) {
    throw new ValidationError("No CloudEvent detected");
  }
  if (isStructuredMessage(message as MQTTMessage<T>)) {
    const evt = (typeof message.body === "string") ? JSON.parse(message.body): message.body;
    return new CloudEvent({
      ...evt as CloudEventV1<T>
    }, false);  
  } else {
    return new CloudEvent<T>({
      ...message.headers,
      data: message.body as T,
    }, false);
  }
}

/**
 * Determine if the message is a CloudEvent
 * @param {Message<T>} message an MQTTMessage
 * @returns {boolean} true if the message contains an event
 */
function isEvent<T>(message: Message<T>): boolean {
  return isBinaryMessage(message) || isStructuredMessage(message as MQTTMessage<T>);
}

function isBinaryMessage<T>(message: Message<T>): boolean {
  return (!!message.headers.id && !!message.headers.source
    && !! message.headers.type && !!message.headers.specversion);
}

function isStructuredMessage<T>(message: MQTTMessage<T>): boolean {
  if (!message) { return false; }
  return (message.PUBLISH && message?.PUBLISH["Content Type"]?.startsWith(CONSTANTS.MIME_CE_JSON)) || false;
}
