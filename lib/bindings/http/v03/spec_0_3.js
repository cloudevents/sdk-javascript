const { v4: uuidv4 } = require("uuid");
const Ajv = require("ajv");
const ValidationError = require("../validation/validation_error.js");

const {
  isBase64,
  clone,
  asData
} = require("../validation/fun.js");

const RESERVED_ATTRIBUTES = {
  type: "type",
  specversion: "specversion",
  source: "source",
  id: "id",
  time: "time",
  schemaurl: "schemaurl",
  datacontentencoding: "datacontentencoding",
  datacontenttype: "datacontenttype",
  subject: "subject",
  data: "data"
};

const SUPPORTED_CONTENT_ENCODING = {};
SUPPORTED_CONTENT_ENCODING.base64 = {
  check: (data) => isBase64(data)
};

const schema = {
  $ref: "#/definitions/event",
  definitions: {
    specversion: {
      const: "0.3"
    },
    datacontenttype: {
      type: "string"
    },
    data: {
      type: [
        "object",
        "string"
      ]
    },
    event: {
      properties: {
        specversion: {
          $ref: "#/definitions/specversion"
        },
        datacontenttype: {
          $ref: "#/definitions/datacontenttype"
        },
        data: {
          $ref: "#/definitions/data"
        },
        id: {
          $ref: "#/definitions/id"
        },
        time: {
          $ref: "#/definitions/time"
        },
        schemaurl: {
          $ref: "#/definitions/schemaurl"
        },
        subject: {
          $ref: "#/definitions/subject"
        },
        type: {
          $ref: "#/definitions/type"
        },
        extensions: {
          $ref: "#/definitions/extensions"
        },
        source: {
          $ref: "#/definitions/source"
        }
      },
      required: [
        "specversion",
        "id",
        "type",
        "source"
      ],
      type: "object"
    },
    id: {
      type: "string",
      minLength: 1
    },
    time: {
      format: "date-time",
      type: "string"
    },
    schemaurl: {
      type: "string",
      format: "uri-reference"
    },
    subject: {
      type: "string",
      minLength: 1
    },
    type: {
      type: "string",
      minLength: 1
    },
    extensions: {
      type: "object"
    },
    source: {
      format: "uri-reference",
      type: "string"
    }
  },
  type: "object"
};

const ajv = new Ajv({
  extendRefs: true
});

const isValidAgainstSchema = ajv.compile(schema);

/** @typedef {import("../../../cloudevent")} CloudEvent */

/**
 * Decorates a CloudEvent with the 0.3 specification getters and setters
 * @ignore
 */
class Spec03 {
  constructor() {
    this.payload = {
      specversion: schema.definitions.specversion.const,
      id: uuidv4(),
      time: new Date().toISOString()
    };
  }

  check() {
    const toCheck = this.payload;

    if (!isValidAgainstSchema(toCheck)) {
      throw new ValidationError("invalid payload", isValidAgainstSchema.errors);
    }

    Array.of(toCheck)
      .filter((tc) => tc.datacontentencoding)
      .map((tc) => tc.datacontentencoding.toLocaleLowerCase("en-US"))
      .filter((dce) => !Object.keys(SUPPORTED_CONTENT_ENCODING).includes(dce))
      .forEach((dce) => {
        throw new ValidationError("invalid payload", [`Unsupported content encoding: ${dce}`]);
      });

    Array.of(toCheck)
      .filter((tc) => tc.datacontentencoding)
      .filter((tc) => (typeof tc.data) === "string")
      .map((tc) => {
        const newtc = clone(tc);
        newtc.datacontentencoding =
          newtc.datacontentencoding.toLocaleLowerCase("en-US");

        return newtc;
      })
      .filter((tc) => Object.keys(SUPPORTED_CONTENT_ENCODING)
        .includes(tc.datacontentencoding))
      .filter((tc) => !SUPPORTED_CONTENT_ENCODING[tc.datacontentencoding]
        .check(tc.data))
      .forEach((tc) => {
        throw new ValidationError("invalid payload", [`Invalid content encoding of data: ${tc.data}`]);
      });
  }

  set id(id) {
    this.payload.id = id;
  }

  get id() {
    return this.payload.id;
  }

  set source(source) {
    this.payload.source = source;
  }

  get source() {
    return this.payload.source;
  }

  get specversion() {
    return this.payload.specversion;
  }

  set type(type) {
    this.payload.type = type;
  }

  get type() {
    return this.payload.type;
  }

  set dataContentType(datacontenttype) {
    this.payload.datacontenttype = datacontenttype;
  }

  get dataContentType() {
    return this.payload.datacontenttype;
  }

  set schemaURL(schema) {
    this.payload.schemaURL = schema;
  }

  get schemaURL() {
    return this.payload.schemaURL;
  }

  set subject(subject) {
    this.payload.subject = subject;
  }

  get subject() {
    return this.payload.subject;
  }

  set time(time) {
    this.payload.time = time;
  }

  get time() {
    return this.payload.time;
  }

  set data(data) {
    this.payload.data = data;
  }

  get data() {
    const dct = this.payload.datacontenttype;
    const dce = this.payload.datacontentencoding;

    if (dct && !dce) {
      this.payload.data = asData(this.payload.data, dct);
    }

    return this.payload.data;
  }

  set dataContentEncoding(encoding) {
    this.payload.datacontentencoding = encoding;
  }

  get dataContentEncoding() {
    return this.payload.datacontentencoding;
  }

}

Spec03.prototype.addExtension = function(key, value) {
  if (!Object.prototype.hasOwnProperty.call(RESERVED_ATTRIBUTES, key)) {
    this.payload[key] = value;
  } else {
    throw new ValidationError(`Reserved attribute name: '${key}'`);
  }
  return this;
};

module.exports = Spec03;
