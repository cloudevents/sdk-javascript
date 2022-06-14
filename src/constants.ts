/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

const CONSTANTS = Object.freeze({
  CHARSET_DEFAULT: "utf-8",
  EXTENSIONS_PREFIX: "ce-",
  ENCODING_BASE64: "base64",
  DATA_ATTRIBUTE: "data",

  MIME_JSON: "application/json",
  MIME_OCTET_STREAM: "application/octet-stream",
  MIME_CE: "application/cloudevents",
  MIME_CE_JSON: "application/cloudevents+json",
  MIME_CE_BATCH: "application/cloudevents-batch+json",
  HEADER_CONTENT_TYPE: "content-type",
  DEFAULT_CONTENT_TYPE: "application/json; charset=utf-8",
  DEFAULT_CE_CONTENT_TYPE: "application/cloudevents+json; charset=utf-8",

  CE_HEADERS: {
    TYPE: "ce-type",
    SPEC_VERSION: "ce-specversion",
    SOURCE: "ce-source",
    ID: "ce-id",
    TIME: "ce-time",
    SUBJECT: "ce-subject",
  },

  CE_ATTRIBUTES: {
    ID: "id",
    TYPE: "type",
    SOURCE: "source",
    SPEC_VERSION: "specversion",
    TIME: "time",
    CONTENT_TYPE: "datacontenttype",
    SUBJECT: "subject",
    DATA: "data",
  },

  BINARY_HEADERS_03: {
    SCHEMA_URL: "ce-schemaurl",
    CONTENT_ENCODING: "ce-datacontentencoding",
  },
  STRUCTURED_ATTRS_03: {
    SCHEMA_URL: "schemaurl",
    CONTENT_ENCODING: "datacontentencoding",
  },

  BINARY_HEADERS_1: {
    DATA_SCHEMA: "ce-dataschema",
  },
  STRUCTURED_ATTRS_1: {
    DATA_SCHEMA: "dataschema",
    DATA_BASE64: "data_base64",
  },
} as const);

export default CONSTANTS;
