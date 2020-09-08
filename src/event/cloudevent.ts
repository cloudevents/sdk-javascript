import { v4 as uuidv4 } from "uuid";

import {
  CloudEventV03,
  CloudEventV03Attributes,
  CloudEventV03OptionalAttributes,
  CloudEventV1,
  CloudEventV1Attributes,
  CloudEventV1OptionalAttributes,
} from "./interfaces";
import { validateCloudEvent } from "./spec";
import { ValidationError, isBinary, asBase64, isValidType } from "./validation";
import CONSTANTS from "../constants";
import { isString } from "util";

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
export class CloudEvent implements CloudEventV1, CloudEventV03 {
  id: string;
  type: string;
  source: string;
  specversion: Version;
  datacontenttype?: string;
  dataschema?: string;
  subject?: string;
  #_time?: string | Date;
  #_data?: Record<string, unknown | string | number | boolean> | string | number | boolean | null | unknown;
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
  constructor(event: CloudEventV1 | CloudEventV1Attributes | CloudEventV03 | CloudEventV03Attributes, strict = true) {
    // copy the incoming event so that we can delete properties as we go
    // everything left after we have deleted know properties becomes an extension
    const properties = { ...event };

    this.id = (properties.id as string) || uuidv4();
    delete properties.id;

    this.type = properties.type;
    delete properties.type;

    this.source = properties.source;
    delete properties.source;

    this.specversion = (properties.specversion as Version) || Version.V1;
    delete properties.specversion;

    this.datacontenttype = properties.datacontenttype;
    delete properties.datacontenttype;

    this.subject = properties.subject;
    delete properties.subject;

    this.#_time = properties.time;
    delete properties.time;

    this.datacontentencoding = properties.datacontentencoding as string;
    delete properties.datacontentencoding;

    this.dataschema = properties.dataschema as string;
    delete properties.dataschema;

    this.data_base64 = properties.data_base64 as string;
    delete properties.data_base64;

    this.schemaurl = properties.schemaurl as string;
    delete properties.schemaurl;

    this._setData(properties.data);
    delete properties.data;

    // Make sure time has a default value and whatever is provided is formatted
    if (!this.#_time) {
      this.#_time = new Date().toISOString();
    } else if (this.#_time instanceof Date) {
      this.#_time = this.#_time.toISOString();
    }

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
        throw new ValidationError("invalid extension name");
      }

      // Value should be spec compliant
      // https://github.com/cloudevents/spec/blob/master/spec.md#type-system
      if (!isValidType(value) && strict) {
        throw new ValidationError("invalid extension value");
      }

      this[key] = value;
    }

    strict ? this.validate() : undefined;

    Object.freeze(this);
  }

  get time(): string | Date {
    return this.#_time as string | Date;
  }

  set time(val: string | Date) {
    this.#_time = new Date(val).toISOString();
  }

  get data(): unknown {
    if (
      this.datacontenttype === CONSTANTS.MIME_JSON &&
      !(this.datacontentencoding === CONSTANTS.ENCODING_BASE64) &&
      isString(this.#_data)
    ) {
      return JSON.parse(this.#_data as string);
    } else if (isBinary(this.#_data)) {
      return asBase64(this.#_data as Uint32Array);
    }
    return this.#_data;
  }

  set data(value: unknown) {
    this._setData(value);
  }

  private _setData(value: unknown): void {
    if (isBinary(value)) {
      this.#_data = value;
      this.data_base64 = asBase64(value as Uint32Array);
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
    event.time = this.time;
    event.data = this.data;
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
        throw new ValidationError("invalid payload", e);
      }
    }
  }

  /**
   * Clone a CloudEvent with new/update attributes
   * @param {object} options attributes to augment the CloudEvent with
   * @param {boolean} strict whether or not to use strict validation when cloning (default: true)
   * @throws if the CloudEvent does not conform to the schema
   * @return {CloudEvent} returns a new CloudEvent
   */
  public cloneWith(
    options:
      | CloudEventV1
      | CloudEventV1Attributes
      | CloudEventV1OptionalAttributes
      | CloudEventV03
      | CloudEventV03Attributes
      | CloudEventV03OptionalAttributes,
    strict = true,
  ): CloudEvent {
    return new CloudEvent(Object.assign({}, this.toJSON(), options) as CloudEvent, strict);
  }
}
