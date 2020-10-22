import { CloudEvent, Version } from "./event/cloudevent";
import { ValidationError } from "./event/validation";
export * from "./event/interfaces";
export * from "./discovery";

import {
  Emitter,
  TransportOptions,
  Options,
  TransportFunction,
  EmitterFunction,
  emitterFor,
} from "./transport/emitter";
import { Receiver } from "./transport/receiver";
import { Protocol } from "./transport/protocols";
import { Headers, Mode, Binding, HTTP, Message, Serializer, Deserializer, headersFor } from "./message";

import CONSTANTS from "./constants";

export {
  // From event
  CloudEvent,
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
  emitterFor,
  Options,
  // From Constants
  CONSTANTS,
};
