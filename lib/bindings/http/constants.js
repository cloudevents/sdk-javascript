// Commons
module.exports = {
  CHARSET_DEFAULT : "utf-8",

  MIME_JSON    : "application/json",
  MIME_CE      : "application/cloudevents",
  MIME_CE_JSON : "application/cloudevents+json",

  HEADER_CONTENT_TYPE : "content-type",

  BINARY_HEADERS_02 : {
    TYPE              : "ce-type",
    SPEC_VERSION      : "ce-specversion",
    SOURCE            : "ce-source",
    ID                : "ce-id",
    TIME              : "ce-time",
    SCHEMA_URL        : "ce-schemaurl",
    EXTENSIONS_PREFIX : "ce-"
  }
}
