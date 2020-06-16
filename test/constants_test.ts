import { expect } from "chai";
import CONSTANTS from "../src/constants";

describe("Constants exposed by top level exports", () => {
  it("Exports an ENCODING_BASE64 constant", () => {
    expect(CONSTANTS.ENCODING_BASE64).to.equal("base64");
  });
  it("Exports a DATA_ATTRIBUTE constant", () => {
    expect(CONSTANTS.DATA_ATTRIBUTE).to.equal("data");
  });
  it("Exports a MIME_JSON constant", () => {
    expect(CONSTANTS.MIME_JSON).to.equal("application/json");
  });
  it("Exports a MIME_OCTET_STREAM constant", () => {
    expect(CONSTANTS.MIME_OCTET_STREAM).to.equal("application/octet-stream");
  });
  it("Exports a MIME_CE constant", () => {
    expect(CONSTANTS.MIME_CE).to.equal("application/cloudevents");
  });
  it("Exports a MIME_CE_JSON constant", () => {
    expect(CONSTANTS.MIME_CE_JSON).to.equal("application/cloudevents+json");
  });
  it("Exports a HEADER_CONTENT_TYPE constant", () => {
    expect(CONSTANTS.HEADER_CONTENT_TYPE).to.equal("content-type");
  });
  it("Exports a DEFAULT_CONTENT_TYPE constant", () => {
    expect(CONSTANTS.DEFAULT_CONTENT_TYPE).to.equal(`${CONSTANTS.MIME_JSON}; charset=${CONSTANTS.CHARSET_DEFAULT}`);
  });
  it("Exports a DEFAULT_CE_CONTENT_TYPE constant", () => {
    expect(CONSTANTS.DEFAULT_CE_CONTENT_TYPE).to.equal(
      `${CONSTANTS.MIME_CE_JSON}; charset=${CONSTANTS.CHARSET_DEFAULT}`,
    );
  });
  describe("V0.3 binary headers constants", () => {
    it("Provides a TYPE header", () => {
      expect(CONSTANTS.CE_HEADERS.TYPE).to.equal("ce-type");
    });
    it("Provides a SPEC_VERSION header", () => {
      expect(CONSTANTS.CE_HEADERS.SPEC_VERSION).to.equal("ce-specversion");
    });
    it("Provides a SOURCE header", () => {
      expect(CONSTANTS.CE_HEADERS.SOURCE).to.equal("ce-source");
    });
    it("Provides an ID header", () => {
      expect(CONSTANTS.CE_HEADERS.ID).to.equal("ce-id");
    });
    it("Provides a TIME header", () => {
      expect(CONSTANTS.CE_HEADERS.TIME).to.equal("ce-time");
    });
    it("Provides a SCHEMA_URL header", () => {
      expect(CONSTANTS.BINARY_HEADERS_03.SCHEMA_URL).to.equal("ce-schemaurl");
    });
    it("Provides a CONTENT_ENCODING header", () => {
      expect(CONSTANTS.BINARY_HEADERS_03.CONTENT_ENCODING).to.equal("ce-datacontentencoding");
    });
    it("Provides a SUBJECT header", () => {
      expect(CONSTANTS.CE_HEADERS.SUBJECT).to.equal("ce-subject");
    });
    it("Provides an EXTENSIONS_PREFIX constant", () => {
      expect(CONSTANTS.EXTENSIONS_PREFIX).to.equal("ce-");
    });
  });
  describe("V0.3 structured attributes constants", () => {
    it("Provides a TYPE attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.TYPE).to.equal("type");
    });
    it("Provides a SPEC_VERSION attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION).to.equal("specversion");
    });
    it("Provides a SOURCE attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.SOURCE).to.equal("source");
    });
    it("Provides an ID attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.ID).to.equal("id");
    });
    it("Provides a TIME attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.TIME).to.equal("time");
    });
    it("Provides a SCHEMA_URL attribute", () => {
      expect(CONSTANTS.STRUCTURED_ATTRS_03.SCHEMA_URL).to.equal("schemaurl");
    });
    it("Provides a CONTENT_ENCODING attribute", () => {
      expect(CONSTANTS.STRUCTURED_ATTRS_03.CONTENT_ENCODING).to.equal("datacontentencoding");
    });
    it("Provides a SUBJECT attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.SUBJECT).to.equal("subject");
    });
    it("Provides a DATA attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.DATA).to.equal("data");
    });
  });
  describe("V01 binary headers constants", () => {
    it("Provides a TYPE header", () => {
      expect(CONSTANTS.CE_HEADERS.TYPE).to.equal("ce-type");
    });
    it("Provides a SPEC_VERSION header", () => {
      expect(CONSTANTS.CE_HEADERS.SPEC_VERSION).to.equal("ce-specversion");
    });
    it("Provides a SOURCE header", () => {
      expect(CONSTANTS.CE_HEADERS.SOURCE).to.equal("ce-source");
    });
    it("Provides an ID header", () => {
      expect(CONSTANTS.CE_HEADERS.ID).to.equal("ce-id");
    });
    it("Provides a TIME header", () => {
      expect(CONSTANTS.CE_HEADERS.TIME).to.equal("ce-time");
    });
    it("Provides a DATA_SCHEMA header", () => {
      expect(CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA).to.equal("ce-dataschema");
    });
    it("Provides a SUBJECT header", () => {
      expect(CONSTANTS.CE_HEADERS.SUBJECT).to.equal("ce-subject");
    });
    it("Provides an EXTENSIONS_PREFIX constant", () => {
      expect(CONSTANTS.EXTENSIONS_PREFIX).to.equal("ce-");
    });
  });
  describe("V1 structured attributes constants", () => {
    it("Provides a TYPE attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.TYPE).to.equal("type");
    });
    it("Provides a SPEC_VERSION attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.SPEC_VERSION).to.equal("specversion");
    });
    it("Provides a SOURCE attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.SOURCE).to.equal("source");
    });
    it("Provides an ID attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.ID).to.equal("id");
    });
    it("Provides a TIME attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.TIME).to.equal("time");
    });
    it("Provides a DATA_SCHEMA attribute", () => {
      expect(CONSTANTS.STRUCTURED_ATTRS_1.DATA_SCHEMA).to.equal("dataschema");
    });
    it("Provides a CONTENT_TYPE attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.CONTENT_TYPE).to.equal("datacontenttype");
    });
    it("Provides a SUBJECT attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.SUBJECT).to.equal("subject");
    });
    it("Provides a DATA attribute", () => {
      expect(CONSTANTS.CE_ATTRIBUTES.DATA).to.equal("data");
    });
    it("Provides a DATA_BASE64 attribute", () => {
      expect(CONSTANTS.STRUCTURED_ATTRS_1.DATA_BASE64).to.equal("data_base64");
    });
  });
});
