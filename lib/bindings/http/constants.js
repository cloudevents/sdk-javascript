// Commons
module.exports = {
  HEADERS : "headers",
  CHARSET_DEFAULT : "utf-8",

  SPEC_V02 : "0.2",
  SPEC_V03 : "0.3",

  DEFAULT_SPEC_VERSION_HEADER : "ce-specversion",

  DATA_ATTRIBUTE : "data",

  MIME_JSON         : "application/json",
  MIME_OCTET_STREAM : "application/octet-stream",
  MIME_CE           : "application/cloudevents",
  MIME_CE_JSON      : "application/cloudevents+json",

  HEADER_CONTENT_TYPE : "content-type",

  DEFAULT_CONTENT_TYPE : "application/json; charset=utf-8",
  DEFAULT_CE_CONTENT_TYPE : "application/cloudevents+json; charset=utf-8",

  BINARY_HEADERS_02 : {
    TYPE              : "ce-type",
    SPEC_VERSION      : "ce-specversion",
    SOURCE            : "ce-source",
    ID                : "ce-id",
    TIME              : "ce-time",
    SCHEMA_URL        : "ce-schemaurl",
    EXTENSIONS_PREFIX : "ce-"
  },
  STRUCTURED_ATTRS_02 : {
    TYPE         : "type",
    SPEC_VERSION : "specversion",
    SOURCE       : "source",
    ID           : "id",
    TIME         : "time",
    SCHEMA_URL   : "schemaurl",
    CONTENT_TYPE : "contenttype",
    DATA         : "data"
  },

  BINARY_HEADERS_03 : {
    TYPE              : "ce-type",
    SPEC_VERSION      : "ce-specversion",
    SOURCE            : "ce-source",
    ID                : "ce-id",
    TIME              : "ce-time",
    SCHEMA_URL        : "ce-schemaurl",
    CONTENT_ENCONDING : "ce-datacontentencoding",
    SUBJECT           : "ce-subject",
    EXTENSIONS_PREFIX : "ce-"
  },
  STRUCTURED_ATTRS_03 : {
    TYPE              : "type",
    SPEC_VERSION      : "specversion",
    SOURCE            : "source",
    ID                : "id",
    TIME              : "time",
    SCHEMA_URL        : "schemaurl",
    CONTENT_ENCONDING : "datacontentencoding",
    CONTENT_TYPE      : "datacontenttype",
    SUBJECT           : "subject",
    DATA              : "data"
  }
};
