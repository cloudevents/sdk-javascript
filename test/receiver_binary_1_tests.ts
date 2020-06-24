import "mocha";
import { expect } from "chai";

import { CloudEvent, ValidationError, Version } from "../src";
import { asBase64 } from "../src/event/validation";
import { BinaryHTTPReceiver } from "../src/transport/http/binary_receiver";
import CONSTANTS from "../src/constants";

const receiver = new BinaryHTTPReceiver(Version.V1);

describe("HTTP Transport Binding Binary Receiver for CloudEvents v1.0", () => {
  describe("Check", () => {
    it("Throw error when payload arg is null or undefined", () => {
      // setup
      const payload = null;
      const attributes = {};

      // act and assert
      expect(receiver.parse.bind(receiver, (payload as unknown) as string, attributes)).to.throw(
        ValidationError,
        "payload is null or undefined",
      );
    });

    it("Throw error when attributes arg is null or undefined", () => {
      // setup
      const payload = {};
      const attributes = undefined;

      expect(receiver.parse.bind(receiver, payload, (attributes as unknown) as string)).to.throw(
        ValidationError,
        "headers is null or undefined",
      );
    });

    it("Throw error when payload is not an object or string", () => {
      // setup
      const payload = 1.2;
      const attributes = {};

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(
        ValidationError,
        "payload must be an object or a string",
      );
    });

    it("Throw error when headers has no 'ce-type'", () => {
      // setup
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(
        ValidationError,
        "header 'ce-type' not found",
      );
    });

    it("Throw error when headers has no 'ce-specversion'", () => {
      // setup
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(
        ValidationError,
        "header 'ce-specversion' not found",
      );
    });

    it("Throw error when headers has no 'ce-source'", () => {
      // setup
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(
        ValidationError,
        "header 'ce-source' not found",
      );
    });

    it("Throw error when headers has no 'ce-id'", () => {
      // setup
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(ValidationError, "header 'ce-id' not found");
    });

    it("Throw error when spec is not 1.0", () => {
      // setup
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: "0.2",
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(ValidationError, "invalid spec version");
    });

    it("Throw error when the content-type is invalid", () => {
      // setup
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "text/html",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.throw(ValidationError, "invalid content type");
    });

    it("No error when content-type is unspecified", () => {
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.not.throw();
    });

    it("No error when all required headers are in place", () => {
      // setup
      const payload = {};
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act and assert
      expect(receiver.parse.bind(receiver, payload, attributes)).to.not.throw();
    });
  });

  describe("Parse", () => {
    it("CloudEvent contains 'type'", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.type).to.equal("type");
    });

    it("CloudEvent contains 'specversion'", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.specversion).to.equal(Version.V1);
    });

    it("CloudEvent contains 'source'", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.source).to.equal("/source");
    });

    it("CloudEvent contains 'id'", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.id).to.equal("id");
    });

    it("CloudEvent contains 'time'", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.time).to.equal("2019-06-16T11:42:00.000Z");
    });

    it("CloudEvent contains 'dataschema'", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.dataschema).to.equal("http://schema.registry/v1");
    });

    it("CloudEvent contains 'contenttype' (application/json)", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.datacontenttype).to.equal("application/json");
    });

    it("CloudEvent contains 'contenttype' (application/octet-stream)", () => {
      // setup
      const payload = "The payload is binary data";
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/octet-stream",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.datacontenttype).to.equal("application/octet-stream");
    });

    it("CloudEvent contains 'data' (application/json)", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.data).to.deep.equal(payload);
    });

    it("CloudEvent contains 'data' (application/octet-stream)", () => {
      // setup
      const payload = "The payload is binary data";
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/octet-stream",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.data).to.deep.equal(payload);
    });

    it("The content of 'data' is base64 for binary", () => {
      // setup
      const expected = {
        data: "dataString",
      };
      const bindata = Uint32Array.from(JSON.stringify(expected) as string, (c) => c.codePointAt(0) as number);
      const payload = asBase64(bindata);

      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "/source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.data).to.deep.equal(expected);
    });

    it("No error when all attributes are in place", () => {
      // setup
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual).to.be.an.instanceof(CloudEvent);
    });

    it("Should accept 'extension1'", () => {
      // setup
      const extension1 = "mycustom-ext1";
      const payload = {
        data: "dataString",
      };
      const attributes = {
        [CONSTANTS.CE_HEADERS.TYPE]: "type",
        [CONSTANTS.CE_HEADERS.SPEC_VERSION]: Version.V1,
        [CONSTANTS.CE_HEADERS.SOURCE]: "source",
        [CONSTANTS.CE_HEADERS.ID]: "id",
        [CONSTANTS.CE_HEADERS.TIME]: "2019-06-16T11:42:00Z",
        [CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]: "http://schema.registry/v1",
        [CONSTANTS.HEADER_CONTENT_TYPE]: "application/json",
        [`${[CONSTANTS.EXTENSIONS_PREFIX]}extension1`]: extension1,
      };

      // act
      const actual = receiver.parse(payload, attributes);

      // assert
      expect(actual.extension1).to.equal(extension1);
    });
  });
});
