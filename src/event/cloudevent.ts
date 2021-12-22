/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { ErrorObject } from "ajv";
import { v4 as uuidv4 } from "uuid";
import { Emitter } from "..";

import { CloudEventV1 } from "./interfaces";
import { validateCloudEvent } from "./spec";
import { ValidationError, isBinary, asBase64, isValidType } from "./validation";

/**
 * An enum representing the CloudEvent specification version
 */
export const enum Version {
  V1 = "1.0",
  V03 = "0.3",
}

/**
 * A CloudEvent describes event data in common formats to provide
 * interoperability across services, platforms and systems.
 * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md
 */
export class CloudEvent<T = undefined> implements CloudEventV1<T> {
  id: string;
  type: string;
  source: string;
  specversion: Version;
  datacontenttype?: string;
  dataschema?: string;
  subject?: string;
  time?: string;
  #_data?: T;
  data_base64?: string;

  // Extensions should not exist as it's own object, but instead
  // exist as properties on the event as siblings of the others
  [key: string]: unknown;

  // V03 deprecated attributes
  schemaurl?: string;
  datacontentencoding?: string;

  /**
   * Creates a new CloudEvent object with the provided properties. If there is a chance that the event
   * properties will not conform to the CloudEvent specification, you may pass a boolean `false` as a
   * second parameter to bypass event validation.
   *
   * @param {object} event the event properties
   * @param {boolean?} strict whether to perform event validation when creating the object - default: true
   */
  constructor(event: Partial<CloudEventV1<T>>, strict = true) {
    // copy the incoming event so that we can delete properties as we go
    // everything left after we have deleted know properties becomes an extension
    const properties = { ...event };

    this.id = (properties.id as string) || uuidv4();
    delete properties.id;

    this.time = properties.time || new Date().toISOString();
    delete properties.time;

    this.type = properties.type as string;
    delete (properties as any).type;

    this.source = properties.source as string;
    delete (properties as any).source;

    this.specversion = (properties.specversion as Version) || Version.V1;
    delete properties.specversion;

    this.datacontenttype = properties.datacontenttype;
    delete properties.datacontenttype;

    this.subject = properties.subject;
    delete properties.subject;

    this.datacontentencoding = properties.datacontentencoding as string;
    delete properties.datacontentencoding;

    this.dataschema = properties.dataschema as string;
    delete properties.dataschema;

    this.data_base64 = properties.data_base64 as string;
    delete properties.data_base64;

    this.schemaurl = properties.schemaurl as string;
    delete properties.schemaurl;

    this.data = properties.data;
    delete properties.data;

    // sanity checking
    if (this.specversion === Version.V1 && this.schemaurl) {
      throw new TypeError("cannot set schemaurl on version 1.0 event");
    } else if (this.specversion === Version.V03 && this.dataschema) {
      throw new TypeError("cannot set dataschema on version 0.3 event");
    }

    // finally process any remaining properties - these are extensions
    for (const [key, value] of Object.entries(properties)) {
      // Extension names should only allow lowercase a-z and 0-9 in the name
      // names should not exceed 20 characters in length
      if (!key.match(/^[a-z0-9]{1,20}$/) && strict) {
        throw new ValidationError(`invalid extension name: ${key}
CloudEvents attribute names MUST consist of lower-case letters ('a' to 'z')
or digits ('0' to '9') from the ASCII character set. Attribute names SHOULD
be descriptive and terse and SHOULD NOT exceed 20 characters in length.`);
      }

      // Value should be spec compliant
      // https://github.com/cloudevents/spec/blob/master/spec.md#type-system
      if (!isValidType(value) && strict) {
        throw new ValidationError(`invalid extension value: ${value}
Extension values must conform to the CloudEvent type system.
See: https://github.com/cloudevents/spec/blob/v1.0/spec.md#type-system`);
      }

      this[key] = value;
    }

    strict ? this.validate() : undefined;

    Object.freeze(this);
  }

  get data(): T | undefined {
    return this.#_data;
  }

  set data(value: T | undefined) {
    if (isBinary(value)) {
      this.data_base64 = asBase64(value);
    }
    this.#_data = value;
  }

  /**
   * Used by JSON.stringify(). The name is confusing, but this method is called by
   * JSON.stringify() when converting this object to JSON.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
   * @return {object} this event as a plain object
   */
  toJSON(): Record<string, unknown> {
    const event = { ...this };
    event.time = new Date(this.time as string).toISOString();
    event.data = !isBinary(this.data) ? this.data : undefined;
    return event;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  /**
   * Validates this CloudEvent against the schema
   * @throws if the CloudEvent does not conform to the schema
   * @return {boolean} true if this event is valid
   */
  public validate(): boolean {
    try {
      return validateCloudEvent(this);
    } catch (e) {
      if (e instanceof ValidationError) {
        throw e;
      } else {
        throw new ValidationError("invalid payload", [e] as ErrorObject[]);
      }
    }
  }

  /**
   * Emit this CloudEvent through the application
   *
   * @param {boolean} ensureDelivery fail the promise if one listener fail
   * @return {Promise<CloudEvent>} this
   */
  public async emit(ensureDelivery = true): Promise<this> {
    await Emitter.emitEvent(this, ensureDelivery);
    return this;
  }

  /**
   * Clone a CloudEvent with new/update attributes
   * @param {object} options attributes to augment the CloudEvent with an `data` property
   * @param {boolean} strict whether or not to use strict validation when cloning (default: true)
   * @throws if the CloudEvent does not conform to the schema
   * @return {CloudEvent} returns a new CloudEvent<T>
   */
  public cloneWith(options: Partial<Exclude<CloudEventV1<never>, "data">>, strict?: boolean): CloudEvent<T>;
  /**
   * Clone a CloudEvent with new/update attributes
   * @param {object} options attributes to augment the CloudEvent with a `data` property
   * @param {boolean} strict whether or not to use strict validation when cloning (default: true)
   * @throws if the CloudEvent does not conform to the schema
   * @return {CloudEvent} returns a new CloudEvent<D>
   */
  public cloneWith<D>(options: Partial<CloudEvent<D>>, strict?: boolean): CloudEvent<D>;
  /**
   * Clone a CloudEvent with new/update attributes
   * @param {object} options attributes to augment the CloudEvent
   * @param {boolean} strict whether or not to use strict validation when cloning (default: true)
   * @throws if the CloudEvent does not conform to the schema
   * @return {CloudEvent} returns a new CloudEvent
   */
  public cloneWith<D>(options: Partial<CloudEventV1<D>>, strict = true): CloudEvent<D | T> {
    return new CloudEvent(Object.assign({}, this.toJSON(), options), strict);
  }

  /**
   * The native `console.log` value of the CloudEvent.
   * @return {string} The string representation of the CloudEvent.
   */
  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return this.toString();
  }
}
