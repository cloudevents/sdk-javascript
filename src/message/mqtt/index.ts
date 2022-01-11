/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Binding, Deserializer, CloudEvent, CloudEventV1, CONSTANTS, Message, ValidationError, Headers } from "../..";

export {
  MQTT,
  MQTTMessage,
};

interface MQTTMessage<T> extends Message<T> {
  PUBLISH: Record<string, string | undefined> | undefined
  payload: T | undefined, // alias of Message#body
  "User Properties": Headers | undefined // alias of Message#headers
}

const MQTT: Binding = {
  binary,
  structured,
  toEvent: toEvent as Deserializer,
  isEvent
};

function binary<T>(event: CloudEventV1<T>): MQTTMessage<T> {
  let properties;
  if (event instanceof CloudEvent) {
    properties = event.toJSON();
  } else {
    properties = event;
  }
  const body = properties.data as T;
  delete properties.data;

  const message: MQTTMessage<T> = {
    PUBLISH: {
      "Content Type": event.datacontenttype,
    },

    // Set #body and its payload alias
    body,
    get payload() {
      return this.body as T;
    },

    // Set #headers and its "User Properties" alias
    headers: properties as any,
    get "User Properties"() {
      return this.headers as any;
    },
  };
  return message;
}

function structured<T>(event: CloudEventV1<T>): MQTTMessage<T> {
  let body;
  if (event instanceof CloudEvent) {
    body = event.toJSON();
  } else {
    body = event;
  }

  const message: MQTTMessage<T> = {
    PUBLISH: {
      // we only support JSON event format
      "Content Type": CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
    },

    // Set #body and its payload alias
    body,
    get payload() {
      return this.body as T;
    },

    // Set #headers and its "User Properties" alias
    headers: {},
    get "User Properties"() {
      return this.headers as any;
    },
  };
  return message;
}

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
