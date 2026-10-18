/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import CONSTANTS from "../../constants";
import { V1, V03 } from "../../event/cloudevent";
import { ValidationError } from "../../event/validation";
import { Message } from "../../message";
import { validate } from "../../schema/validator";

const SHARED_ATTRIBUTES = ["id", "source", "specversion", "type", "subject", "time", "datacontenttype"];

/**
 * Check CloudEvents header additions after all caller headers have been merged.
 * Messages without added CloudEvents headers and unrelated HTTP headers do not trigger event validation.
 * Changes to existing headers have already been rejected by then.
 *
 * @param {Message} message the message whose body will be sent unchanged
 * @param {Headers} original the headers produced by the binding
 * @param {Headers} headers the headers that will be sent
 * @returns {void}
 */
export function validateHeaderAdditions(
  message: Message, original: Headers, headers: Headers,
): void {
  const added = new Set<string>();
  headers.forEach((value, name) => {
    if (name.startsWith(CONSTANTS.EXTENSIONS_PREFIX) && !original.has(name)) {
      added.add(name);
    }
  });
  const typeAdded = headers.get(CONSTANTS.HEADER_CONTENT_TYPE) !== original.get(CONSTANTS.HEADER_CONTENT_TYPE);
  if (added.size === 0 && !typeAdded) {
    return;
  }

  const type = mediaType(headers);
  const attributeValue = (name: string, value: string): string =>
    added.has(name) ? headerAttribute(value) : value;
  if (type.startsWith(CONSTANTS.MIME_CE)) {
    if (type !== CONSTANTS.MIME_CE_JSON || typeof message.body !== "string") {
      if (added.size > 0) {
        throw new TypeError("cannot verify CloudEvents headers against the structured body");
      }
      return;
    }
    let payload: Record<string, unknown>;
    try {
      payload = (JSON.parse(message.body) ?? {}) as Record<string, unknown>;
    } catch {
      throw new TypeError("invalid JSON CloudEvent body");
    }
    const version = payload.specversion;
    validateAttributes(payload, version);
    const attributes = { ...payload };
    headers.forEach((value, name) => {
      if (!name.startsWith(CONSTANTS.EXTENSIONS_PREFIX)
        || (!typeAdded && !added.has(name))) {
        return;
      }
      const attribute = attributeName(name, version);
      const decoded = attributeValue(name, value);
      attributes[attribute] = decoded;
      const expected = payload[attribute];
      const matches = decoded === String(expected)
        || (attribute === CONSTANTS.CE_ATTRIBUTES.TIME
          && new Date(decoded).getTime() === new Date(expected as string).getTime());
      if (!Object.prototype.hasOwnProperty.call(payload, attribute) || !matches) {
        throw new TypeError(`${name} does not match the structured CloudEvent body`);
      }
    });
    validateAttributes(attributes, version);
    return;
  }

  const rawVersion = headers.get(CONSTANTS.CE_HEADERS.SPEC_VERSION);
  const version = rawVersion === null ? null : attributeValue(CONSTANTS.CE_HEADERS.SPEC_VERSION, rawVersion);
  if (!isKnownVersion(version)) {
    return;
  }
  const attributes: Record<string, unknown> = Object.create(null);
  headers.forEach((value, name) => {
    if (name.startsWith(CONSTANTS.EXTENSIONS_PREFIX)) {
      attributes[attributeName(name, version)] = attributeValue(name, value);
    }
  });
  if (headers.has(CONSTANTS.HEADER_CONTENT_TYPE)) {
    attributes[CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE] = headers.get(CONSTANTS.HEADER_CONTENT_TYPE);
  }
  validateAttributes(attributes, version);
}

function isKnownVersion(version: unknown): boolean {
  return version === V1 || version === V03;
}

function mediaType(headers: Headers): string {
  return (headers.get(CONSTANTS.HEADER_CONTENT_TYPE) ?? "").split(";", 1)[0].trim().toLowerCase();
}

function attributeName(name: string, version: unknown): string {
  const attribute = name.slice(CONSTANTS.EXTENSIONS_PREFIX.length);
  // 1.0 sends datacontenttype as content-type, never as a ce- header
  if (version === V1 && (!/^[a-z0-9]+$/.test(attribute) || attribute === CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE)) {
    throw new TypeError(`invalid CloudEvents 1.0 header: ${name}`);
  }
  return attribute;
}

// Accept older quoted header forms before percent-decoding.
function headerAttribute(value: string): string {
  const unquoted = value.startsWith("\"") && value.endsWith("\"")
    ? value.slice(1, -1).replace(/\\(.)/g, "$1")
    : value;
  try {
    return decodeURIComponent(unquoted);
  } catch {
    throw new TypeError("CloudEvents header values must use valid UTF-8 percent encoding");
  }
}

// Validate raw attributes before constructor defaults or parser corrections.
function validateAttributes(attributes: Record<string, unknown>, version: unknown): void {
  if (typeof version === "string" && version !== "" && !isKnownVersion(version)) {
    return;
  }
  let checked = attributes;
  if (version === V03) {
    // Only the shared attributes use the 1.0 schema. 0.3 also permits map
    // extensions and has different schema and content-encoding attributes.
    checked = {};
    for (const name of SHARED_ATTRIBUTES) {
      if (Object.prototype.hasOwnProperty.call(attributes, name)) {
        checked[name] = attributes[name];
      }
    }
  }
  if (!validate(checked)) {
    throw new ValidationError("invalid HTTP CloudEvents attributes", validate.errors);
  }
  if (version === V1) {
    for (const name of Object.keys(attributes)) {
      if (name !== CONSTANTS.STRUCTURED_ATTRS_1.DATA_BASE64 && !/^[a-z0-9]+$/.test(name)) {
        throw new TypeError(`invalid CloudEvents attribute name: ${name}`);
      }
    }
  }
}
