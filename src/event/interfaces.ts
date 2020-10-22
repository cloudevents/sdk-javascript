/**
 * The object interface for CloudEvents 1.0.
 * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md
 */
export interface CloudEventV1 extends CloudEventV1Attributes {
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

export interface CloudEventV1Attributes extends CloudEventV1OptionalAttributes {
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

export interface CloudEventV1OptionalAttributes {
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
  data?: Record<string, unknown | string | number | boolean> | string | number | boolean | null | unknown;

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

/**
 * The object interface for CloudEvents 0.3.
 * @see https://github.com/cloudevents/spec/blob/v0.3/spec.md
 */

export interface CloudEventV03 extends CloudEventV03Attributes {
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

export interface CloudEventV03Attributes extends CloudEventV03OptionalAttributes {
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

export interface CloudEventV03OptionalAttributes {
  /**
   * The following fields are optional.
   */

  /**
   * [OPTIONAL] Describes the content encoding for the data attribute for when the
   * data field MUST be encoded as a string, like with structured transport binding
   * modes using the JSON event format, but the datacontenttype indicates a non-string
   * media type. When the data field's effective data type is not String, this attribute
   * MUST NOT be set and MUST be ignored when set.
   */
  datacontentencoding?: string;

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
   * [OPTIONAL] A link to the schema that the data attribute adheres to.
   * Incompatible changes to the schema SHOULD be reflected by a different URL.
   * If present, MUST be a non-empty URI.
   */
  schemaurl?: string;
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
  data?: Record<string, unknown | string | number | boolean> | string | number | boolean | null | unknown;
  /**
   * [OPTIONAL] CloudEvents extension attributes.
   */
  [key: string]: unknown;
}

/**
 * Definition of a CloudEvents Service
 */
export interface CloudEventV1Service {
  /**
   * [REQUIRED] A URL that references this Service. This value MUST
   * be usable in subsequent requests, by authorized clients, to retrieve this
   * Service entity.
   * @required MUST be a non-empty URL
   * @required MUST end with `fsegments` (per RFC1738) of: `/services/{name}` where
   *     `name` is the Service's `name` attribute.
   * @example `http://example.com/services/storage`
   * @example `http://discovery.github.com/services/github`
   */
  url: string;

  /**
   * [REQUIRED] A unique identifier for this Service. This value MUST be unique within the scope of this
   * Discovery Endpoint.
   *
   * @required MUST be a valid `fsegment` per RFC1738.
   * @example storage
   * @example github
   */
  name: string;

  /**
   * [OPTIONAL] Human readable description.
   * If present, MUST be a non-empty string
   */
  description?: string;
  /**
   * Absolute URL that provides a link to additional documentation
   * about the service. This is intended for a developer to
   * use in order to learn more about this service's events produced.
   *
   * If present, MUST be a non-empty absolute URI
   *
   * @example http://cloud.example.com/docs/blobstorage
   */
  docsurl?: string;
  /**
   * [REQUIRED] CloudEvents [`specversions`](https://github.com/cloudevents/spec/blob/master/spec.md#specversion)
   * that can be used for events published for this service.
   *
   * @required MUST be a non-empty array or non-empty strings.
   * @required strings define per [RFC 2046](https://tools.ietf.org/html/rfc2046)
   */
  specversions: string[];
  /**
   * [REQUIRED] An absolute URL indicating where CloudSubscriptions `subscribe`
   * API calls MUST be sent to.
   */
  subscriptionurl: string;
  /**
   * A map indicating supported options for the `config` parameter
   * for the CloudSubscriptions subscribe() API call. Keys are the name of keys
   * in the allowed config map, the values indicate the type of that parameter,
   * confirming to the CloudEvents [type system](https://github.com/cloudevents/spec/blob/master/spec.md#type-system).
   * TODO: Needs resolution with CloudSubscriptions API
   */
  subscriptionconfig?: { [key: string]: string };
  /**
   * Authorization scope needed for creating subscriptions.
   * The actual meaning of this field is determined on a per-service basis.
   * @example storage.read
   */
  authscope?: string;
  /**
   * [REQUIRED] This field describes the different values that might be passed
   * in the `protocol` field of the CloudSubscriptions API. The protocols with
   * existing CloudEvents bindings are identified as AMQP, MQTT3, MQTT5, HTTP,
   * KAFKA, and NATS. An implementation MAY add support for further
   * protocols. All services MUST support at least one delivery protocol, and MAY
   * support additional protocols.
   * @example [ "HTTP" ]
   * @example [ "HTTP", "AMQP", "KAFKA" ]
   */
  protocols: string[];
  /**
   * [REQUIRED] CloudEvent types produced by the service
   */
  types: CloudEventV1Type[];
}

/**
 * Definition of a CloudEvents Type Extension
 */
export interface CloudEventV1TypeExtension {
  /**
   * [REQUIRED] the CloudEvents context attribute name used by this extension.
   * It MUST adhere to the CloudEvents context attrbibute naming rules
   * @example dataref
   */
  name: string;
  /**
   * [REQUIRED] the data type of the extension attribute. It MUST adhere to the
   * CloudEvents [type system](./spec.md#type-system)
   * @example URI-reference
   */
  type: string;
  /**
   * an attribute pointing to the specification that defines the extension
   * @example https://github.com/cloudevents/spec/blob/master/extensions/dataref.md
   */
  specurl?: string;
}

/**
 * Definition of a CloudEvents Type
 */
export interface CloudEventV1Type {
  /**
   * [REQUIRED] CloudEvents
   * [`type`](https://github.com/cloudevents/spec/blob/master/spec.md#type)
   * attribute.
   * @required MUST be a non-empty string, following the constraints as defined in the
   * CloudEvents spec.
   * @example com.github.pull.create
   * @example com.example.object.delete.v2
   */
  type: string;
  /**
   * Human readable description.
   * If present, MUST be a non-empty string
   */
  description?: string;
  /**
   * CloudEvents [`datacontenttype`](https://github.com/cloudevents/spec/blob/master/spec.md#datacontenttype)
   * attribute. Indicating how the `data` attribute of subscribed events will be
   * encoded.
   *
   * If present, MUST adhere to the format specified in [RFC 2046](https://tools.ietf.org/html/rfc2046)
   */
  datacontenttype?: string;
  /**
   * CloudEvents [`datacontenttype`](https://github.com/cloudevents/spec/blob/master/spec.md#dataschema)
   * attribute. This identifies the canonical storage location of the schema of
   * the `data` attribute of subscribed events.
   *
   * If present, MUST be a non-empty URI
   */
  dataschema?: string;
  /**
   * If using `dataschemacontent` for inline schema storage, the
   * `dataschematype` indicates the type of schema represented there.
   *
   * If present, MUST adhere to the format specified in [RFC 2046](https://tools.ietf.org/html/rfc2046)
   * @example application/json
   */
  dataschematype?: string;
  /**
   * An inline representation of the schema of the `data` attribute
   * encoding mechanism. This is an alternative to using the `dataschema`
   * attribute.
   *
   * If present, MUST be a non-empty string containing a schema compatible with
   * the `datacontenttype`.
   * If `dataschama` is present, this field MUST NOT be present.
   */
  dataschemacontent?: string;
  /**
   * An array or CloudEvents
   * [Extension Context Attributes](http://github.com/cloudevents/spec/blob/master/spec.md#extension-context-attributes)
   * that are used for this event `type`.
   */
  extensions?: CloudEventV1TypeExtension[];
}
