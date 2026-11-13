/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

export const SCOPE_NAME = "cloudevents";

// The CloudEvents and messaging semantic conventions are still in development
export const ATTR_CLOUDEVENTS_EVENT_ID = "cloudevents.event_id";
export const ATTR_CLOUDEVENTS_EVENT_SOURCE = "cloudevents.event_source";
export const ATTR_CLOUDEVENTS_EVENT_SPEC_VERSION = "cloudevents.event_spec_version";
export const ATTR_CLOUDEVENTS_EVENT_SUBJECT = "cloudevents.event_subject";
export const ATTR_CLOUDEVENTS_EVENT_TYPE = "cloudevents.event_type";
export const ATTR_MESSAGING_BATCH_MESSAGE_COUNT = "messaging.batch.message_count";
export const ATTR_MESSAGING_DESTINATION_NAME = "messaging.destination.name";
export const ATTR_MESSAGING_DESTINATION_TEMPLATE = "messaging.destination.template";
export const ATTR_MESSAGING_MESSAGE_ID = "messaging.message.id";
export const ATTR_MESSAGING_OPERATION_NAME = "messaging.operation.name";
export const ATTR_MESSAGING_OPERATION_TYPE = "messaging.operation.type";
export const ATTR_MESSAGING_SYSTEM_NAME = "messaging.system.name";

export const ATTR_ERROR_TYPE = "error.type";
export const ATTR_EXCEPTION_MESSAGE = "exception.message";
export const ATTR_SERVER_ADDRESS = "server.address";
export const ATTR_SERVER_PORT = "server.port";

export const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10];

// Without a system-specific name, an operation is named after its type
export type Operation = "process" | "send";
