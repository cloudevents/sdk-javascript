/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEvent, V1, V03 } from "./event/cloudevent";
import { ValidationError } from "./event/validation";
import { CloudEventV1, CloudEventV1Attributes } from "./event/interfaces";

import { Options, TransportFunction, EmitterFunction, emitterFor, Emitter } from "./transport/emitter";
import { httpTransport } from "./transport/http";
import {
  Headers, Mode, Binding, HTTP, Kafka, KafkaEvent, KafkaMessage, Message, MQTT, MQTTMessage, MQTTMessageFactory,
  Serializer, Deserializer } from "./message";

import CONSTANTS from "./constants";

export {
  // From event
  CloudEvent,
  V1,
  V03,
  ValidationError,
  Mode,
  HTTP,
  Kafka,
  MQTT,
  MQTTMessageFactory,
  emitterFor,
  httpTransport,
  Emitter,
  // From Constants
  CONSTANTS
};

export type {
  CloudEventV1,
  CloudEventV1Attributes,
  // From message
  Headers,
  Binding,
  Message,
  Deserializer,
  Serializer,
  KafkaEvent,
  KafkaMessage,
  MQTTMessage,
  // From transport
  TransportFunction,
  EmitterFunction,
  Options
};
