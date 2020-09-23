import { CloudEvent, Version } from "./event/cloudevent";
import { ValidationError } from "./event/validation";
import { CloudEventV03, CloudEventV03Attributes, CloudEventV1, CloudEventV1Attributes } from "./event/interfaces";

import {
  Emitter,
  TransportOptions,
  Options,
  TransportFunction,
  EmitterFunction,
  emitterFactory,
} from "./transport/emitter";
import { Receiver } from "./transport/receiver";
import { Protocol } from "./transport/protocols";
import { Headers, Mode, Binding, HTTP, Message, Serializer, Deserializer, headersFor } from "./message";

import CONSTANTS from "./constants";

export {
  // From event
  CloudEvent,
  CloudEventV03,
  CloudEventV03Attributes,
  CloudEventV1,
  CloudEventV1Attributes,
  Version,
  ValidationError,
  // From message
  Headers,
  Mode,
  Binding,
  Message,
  Deserializer,
  Serializer,
  headersFor, // TODO: Deprecated. Remove for 4.0
  HTTP,
  // From transport
  Emitter, // TODO: Deprecated. Remove for 4.0
  Receiver, // TODO: Deprecated. Remove for 4.0
  Protocol, // TODO: Deprecated. Remove for 4.0
  TransportOptions, // TODO: Deprecated. Remove for 4.0
  TransportFunction,
  EmitterFunction,
  emitterFactory,
  Options,
  // From Constants
  CONSTANTS,
};
