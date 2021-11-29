/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

/**
 * The object interface for CloudEvents 1.0.
 * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md
 */
export interface CloudEventV1<T> extends CloudEventV1Attributes<T> {
  // REQUIRED Attributes
  /**
   * [REQUIRED] Identifies the event. Producers MUST ensure that `source` + `id`
   * is unique for each distinct event. If a duplicate event is re-sent (e.g. due
   * to a network error) it MAY have the same `id`. Consumers MAY assume that
   * Events with identical `source` and `id` are duplicates.
   * @required Non-empty string. Unique within producer.
   * @example An event counter maintained by the producer
   * @example A UUID
   */
  id: string;

  /**
   * [REQUIRED] The version of the CloudEvents specification which the event
   * uses. This enables the interpretation of the context. Compliant event
   * producers MUST use a value of `1.0` when referring to this version of the
   * specification.
   * @required MUST be a non-empty string.
   */
  specversion: string;
}

export interface CloudEventV1Attributes<T> extends CloudEventV1OptionalAttributes<T> {
  /**
   * [REQUIRED] Identifies the context in which an event happened. Often this
   * will include information such as the type of the event source, the
   * organization publishing the event or the process that produced the event. The
   * exact syntax and semantics behind the data encoded in the URI is defined by
   * the event producer.
   * Producers MUST ensure that `source` + `id` is unique for each distinct event.
   * An application MAY assign a unique `source` to each distinct producer, which
   * makes it easy to produce unique IDs since no other producer will have the same
   * source. The application MAY use UUIDs, URNs, DNS authorities or an
   * application-specific scheme to create unique `source` identifiers.
   * A source MAY include more than one producer. In that case the producers MUST
   * collaborate to ensure that `source` + `id` is unique for each distinct event.
   * @required Non-empty URI-reference
   */
  source: string;

  /**
   * [REQUIRED] This attribute contains a value describing the type of event
   * related to the originating occurrence. Often this attribute is used for
   * routing, observability, policy enforcement, etc. The format of this is
   * producer defined and might include information such as the version of the
   * `type` - see
   * [Versioning of Attributes in the Primer](primer.md#versioning-of-attributes)
   * for more information.
   * @required MUST be a non-empty string
   * @should SHOULD be prefixed with a reverse-DNS name. The prefixed domain dictates the
   *   organization which defines the semantics of this event type.
   * @example com.github.pull.create
   * @example com.example.object.delete.v2
   */
  type: string;
}

export interface CloudEventV1OptionalAttributes<T> {
  /**
   * The following fields are optional.
   */

  /**
   * [OPTIONAL] Content type of `data` value. This attribute enables `data` to
   * carry any type of content, whereby format and encoding might differ from that
   * of the chosen event format. For example, an event rendered using the
   * [JSON envelope](./json-format.md#3-envelope) format might carry an XML payload
   * in `data`, and the consumer is informed by this attribute being set to
   * "application/xml". The rules for how `data` content is rendered for different
   * `datacontenttype` values are defined in the event format specifications; for
   * example, the JSON event format defines the relationship in
   * [section 3.1](./json-format.md#31-handling-of-data).
   */
  datacontenttype?: string;
  /**
   * [OPTIONAL] Identifies the schema that `data` adheres to. Incompatible
   * changes to the schema SHOULD be reflected by a different URI. See
   * [Versioning of Attributes in the Primer](primer.md#versioning-of-attributes)
   * for more information.
   * If present, MUST be a non-empty URI.
   */
  dataschema?: string;
  /**
   * [OPTIONAL] This describes the subject of the event in the context of the
   * event producer (identified by `source`). In publish-subscribe scenarios, a
   * subscriber will typically subscribe to events emitted by a `source`, but the
   * `source` identifier alone might not be sufficient as a qualifier for any
   * specific event if the `source` context has internal sub-structure.
   *
   * Identifying the subject of the event in context metadata (opposed to only in
   * the `data` payload) is particularly helpful in generic subscription filtering
   * scenarios where middleware is unable to interpret the `data` content. In the
   * above example, the subscriber might only be interested in blobs with names
   * ending with '.jpg' or '.jpeg' and the `subject` attribute allows for
   * constructing a simple and efficient string-suffix filter for that subset of
   * events.
   *
   * If present, MUST be a non-empty string.
   * @example "https://example.com/storage/tenant/container"
   * @example "mynewfile.jpg"
   */
  subject?: string;
  /**
   * [OPTIONAL] Timestamp of when the occurrence happened. If the time of the
   * occurrence cannot be determined then this attribute MAY be set to some other
   * time (such as the current time) by the CloudEvents producer, however all
   * producers for the same `source` MUST be consistent in this respect. In other
   * words, either they all use the actual time of the occurrence or they all use
   * the same algorithm to determine the value used.
   * @example "2020-08-08T14:48:09.769Z"
   */
  time?: string;
  /**
   * [OPTIONAL] The event payload. This specification does not place any restriction
   * on the type of this information. It is encoded into a media format which is
   * specified by the datacontenttype attribute (e.g. application/json), and adheres
   * to the dataschema format when those respective attributes are present.
   */
  data?: T;

  /**
   * [OPTIONAL] The event payload encoded as base64 data. This is used when the
   * data is in binary form.
   * @see https://github.com/cloudevents/spec/blob/v1.0/json-format.md#31-handling-of-data
   */
  data_base64?: string;

  /**
   * [OPTIONAL] CloudEvents extension attributes.
   */
  [key: string]: unknown;
}
