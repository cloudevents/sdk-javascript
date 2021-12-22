/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { CloudEventV1, CONSTANTS, Headers } from "../..";

type KafkaHeaders = Readonly<{
  ID: string;
  TYPE: string;
  SOURCE: string;
  SPEC_VERSION: string;
  TIME: string;
  SUBJECT: string;
  DATACONTENTTYPE: string;
  DATASCHEMA: string;
  [key: string]: string;
}>

/**
 * The set of CloudEvent headers that may exist on a Kafka message
 */
export const KAFKA_CE_HEADERS: KafkaHeaders = Object.freeze({
  /** corresponds to the CloudEvent#id */
  ID: "ce_id",
  /** corresponds to the CloudEvent#type */
  TYPE: "ce_type",
  /** corresponds to the CloudEvent#source */
  SOURCE: "ce_source",
  /** corresponds to the CloudEvent#specversion */
  SPEC_VERSION:  "ce_specversion",
  /** corresponds to the CloudEvent#time */
  TIME: "ce_time",
  /** corresponds to the CloudEvent#subject */
  SUBJECT: "ce_subject",
  /** corresponds to the CloudEvent#datacontenttype */
  DATACONTENTTYPE: "ce_datacontenttype",
  /** corresponds to the CloudEvent#dataschema */
  DATASCHEMA: "ce_dataschema",
} as const);

export const HEADER_MAP: { [key: string]: string } = {
  [KAFKA_CE_HEADERS.ID]: "id",
  [KAFKA_CE_HEADERS.TYPE]: "type",
  [KAFKA_CE_HEADERS.SOURCE]: "source",
  [KAFKA_CE_HEADERS.SPEC_VERSION]: "specversion",
  [KAFKA_CE_HEADERS.TIME]: "time",
  [KAFKA_CE_HEADERS.SUBJECT]: "subject",
  [KAFKA_CE_HEADERS.DATACONTENTTYPE]: "datacontenttype",
  [KAFKA_CE_HEADERS.DATASCHEMA]: "dataschema"
};

/**
 * A conveninece function to convert a CloudEvent into headers
 * @param {CloudEvent} event a CloudEvent object
 * @returns {Headers} the CloudEvent attribute as Kafka headers
 */
export function headersFor<T>(event: CloudEventV1<T>): Headers {
  const headers: Headers = {};

  Object.getOwnPropertyNames(event).forEach((property) => {
    // Ignore the 'data' property
    // it becomes the Kafka message's 'value' field
    if (property != CONSTANTS.CE_ATTRIBUTES.DATA && property != CONSTANTS.STRUCTURED_ATTRS_1.DATA_BASE64) {
      // all CloudEvent property names get prefixed with 'ce_'
      // https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#3231-property-names
      headers[`ce_${property}`] = event[property] as string;
    }
  });

  return headers;
}
