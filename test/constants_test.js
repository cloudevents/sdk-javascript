const expect = require("chai").expect;

const {
  HEADERS,
  CHARSET_DEFAULT,
  BINARY,
  STRUCTURED,
  SPEC_V03,
  SPEC_V1,
  DEFAULT_SPEC_VERSION_HEADER,
  ENCODING_BASE64,
  DATA_ATTRIBUTE,
  MIME_JSON,
  MIME_OCTET_STREAM,
  MIME_CE,
  MIME_CE_JSON,
  HEADER_CONTENT_TYPE,
  DEFAULT_CONTENT_TYPE,
  DEFAULT_CE_CONTENT_TYPE,
  BINARY_HEADERS_03,
  STRUCTURED_ATTRS_03,
  BINARY_HEADERS_1,
  STRUCTURED_ATTRS_1
} = require("../").Constants;

describe("Constants exposed by top level exports", () => {
  it("Exports a HEADERS constant", () => {
    expect(HEADERS).to.equal("headers");
  });
  it("Exports a CHARSET_DEFAULT constant", () => {
    expect(CHARSET_DEFAULT).to.equal("utf-8");
  });
  it("Exports a BINARY constant", () => {
    expect(BINARY).to.equal("binary");
  });
  it("Exports a STRUCTURED constant", () => {
    expect(STRUCTURED).to.equal("structured");
  });
  it("Exports a SPEC_V03 constant", () => {
    expect(SPEC_V03).to.equal("0.3");
  });
  it("Exports a SPEC_V1 constant", () => {
    expect(SPEC_V1).to.equal("1.0");
  });
  it("Exports a DEFAULT_SPEC_VERSION_HEADER constant", () => {
    expect(DEFAULT_SPEC_VERSION_HEADER).to.equal("ce-specversion");
  });
  it("Exports an ENCODING_BASE64 constant", () => {
    expect(ENCODING_BASE64).to.equal("base64");
  });
  it("Exports a DATA_ATTRIBUTE constant", () => {
    expect(DATA_ATTRIBUTE).to.equal("data");
  });
  it("Exports a MIME_JSON constant", () => {
    expect(MIME_JSON).to.equal("application/json");
  });
  it("Exports a MIME_OCTET_STREAM constant", () => {
    expect(MIME_OCTET_STREAM).to.equal("application/octet-stream");
  });
  it("Exports a MIME_CE constant", () => {
    expect(MIME_CE).to.equal("application/cloudevents");
  });
  it("Exports a MIME_CE_JSON constant", () => {
    expect(MIME_CE_JSON).to.equal("application/cloudevents+json");
  });
  it("Exports a HEADER_CONTENT_TYPE constant", () => {
    expect(HEADER_CONTENT_TYPE).to.equal("content-type");
  });
  it("Exports a DEFAULT_CONTENT_TYPE constant", () => {
    expect(DEFAULT_CONTENT_TYPE).to.equal(`${MIME_JSON}; charset=${CHARSET_DEFAULT}`);
  });
  it("Exports a DEFAULT_CE_CONTENT_TYPE constant", () => {
    expect(DEFAULT_CE_CONTENT_TYPE).to.equal(`${MIME_CE_JSON}; charset=${CHARSET_DEFAULT}`);
  });
  describe("V0.3 binary headers constants", () => {
    it("Provides a TYPE header", () => {
      expect(BINARY_HEADERS_03.TYPE).to.equal("ce-type");
    });
    it("Provides a SPEC_VERSION header", () => {
      expect(BINARY_HEADERS_03.SPEC_VERSION).to.equal("ce-specversion");
    });
    it("Provides a SOURCE header", () => {
      expect(BINARY_HEADERS_03.SOURCE).to.equal("ce-source");
    });
    it("Provides an ID header", () => {
      expect(BINARY_HEADERS_03.ID).to.equal("ce-id");
    });
    it("Provides a TIME header", () => {
      expect(BINARY_HEADERS_03.TIME).to.equal("ce-time");
    });
    it("Provides a SCHEMA_URL header", () => {
      expect(BINARY_HEADERS_03.SCHEMA_URL).to.equal("ce-schemaurl");
    });
    it("Provides a CONTENT_ENCODING header", () => {
      expect(BINARY_HEADERS_03.CONTENT_ENCONDING).to.equal("ce-datacontentencoding");
    });
    it("Provides a SUBJECT header", () => {
      expect(BINARY_HEADERS_03.SUBJECT).to.equal("ce-subject");
    });
    it("Provides an EXTENSIONS_PREFIX constant", () => {
      expect(BINARY_HEADERS_03.EXTENSIONS_PREFIX).to.equal("ce-");
    });
  });
  describe("V0.3 structured attributes constants", () => {
    it("Provides a TYPE attribute", () => {
      expect(STRUCTURED_ATTRS_03.TYPE).to.equal("type");
    });
    it("Provides a SPEC_VERSION attribute", () => {
      expect(STRUCTURED_ATTRS_03.SPEC_VERSION).to.equal("specversion");
    });
    it("Provides a SOURCE attribute", () => {
      expect(STRUCTURED_ATTRS_03.SOURCE).to.equal("source");
    });
    it("Provides an ID attribute", () => {
      expect(STRUCTURED_ATTRS_03.ID).to.equal("id");
    });
    it("Provides a TIME attribute", () => {
      expect(STRUCTURED_ATTRS_03.TIME).to.equal("time");
    });
    it("Provides a SCHEMA_URL attribute", () => {
      expect(STRUCTURED_ATTRS_03.SCHEMA_URL).to.equal("schemaurl");
    });
    it("Provides a CONTENT_ENCODING attribute", () => {
      expect(STRUCTURED_ATTRS_03.CONTENT_ENCONDING).to.equal("datacontentencoding");
    });
    it("Provides a SUBJECT attribute", () => {
      expect(STRUCTURED_ATTRS_03.SUBJECT).to.equal("subject");
    });
    it("Provides a DATA attribute", () => {
      expect(STRUCTURED_ATTRS_03.DATA).to.equal("data");
    });
  });
  describe("V01 binary headers constants", () => {
    it("Provides a TYPE header", () => {
      expect(BINARY_HEADERS_1.TYPE).to.equal("ce-type");
    });
    it("Provides a SPEC_VERSION header", () => {
      expect(BINARY_HEADERS_1.SPEC_VERSION).to.equal("ce-specversion");
    });
    it("Provides a SOURCE header", () => {
      expect(BINARY_HEADERS_1.SOURCE).to.equal("ce-source");
    });
    it("Provides an ID header", () => {
      expect(BINARY_HEADERS_1.ID).to.equal("ce-id");
    });
    it("Provides a TIME header", () => {
      expect(BINARY_HEADERS_1.TIME).to.equal("ce-time");
    });
    it("Provides a DATA_SCHEMA header", () => {
      expect(BINARY_HEADERS_1.DATA_SCHEMA).to.equal("ce-dataschema");
    });
    it("Provides a SUBJECT header", () => {
      expect(BINARY_HEADERS_1.SUBJECT).to.equal("ce-subject");
    });
    it("Provides an EXTENSIONS_PREFIX constant", () => {
      expect(BINARY_HEADERS_1.EXTENSIONS_PREFIX).to.equal("ce-");
    });
  });
  describe("V1 structured attributes constants", () => {
    it("Provides a TYPE attribute", () => {
      expect(STRUCTURED_ATTRS_1.TYPE).to.equal("type");
    });
    it("Provides a SPEC_VERSION attribute", () => {
      expect(STRUCTURED_ATTRS_1.SPEC_VERSION).to.equal("specversion");
    });
    it("Provides a SOURCE attribute", () => {
      expect(STRUCTURED_ATTRS_1.SOURCE).to.equal("source");
    });
    it("Provides an ID attribute", () => {
      expect(STRUCTURED_ATTRS_1.ID).to.equal("id");
    });
    it("Provides a TIME attribute", () => {
      expect(STRUCTURED_ATTRS_1.TIME).to.equal("time");
    });
    it("Provides a DATA_SCHEMA attribute", () => {
      expect(STRUCTURED_ATTRS_1.DATA_SCHEMA).to.equal("dataschema");
    });
    it("Provides a CONTENT_TYPE attribute", () => {
      expect(STRUCTURED_ATTRS_1.CONTENT_TYPE).to.equal("datacontenttype");
    });
    it("Provides a SUBJECT attribute", () => {
      expect(STRUCTURED_ATTRS_1.SUBJECT).to.equal("subject");
    });
    it("Provides a DATA attribute", () => {
      expect(STRUCTURED_ATTRS_1.DATA).to.equal("data");
    });
    it("Provides a DATA_BASE64 attribute", () => {
      expect(STRUCTURED_ATTRS_1.DATA_BASE64).to.equal("data_base64");
    });
  });
});