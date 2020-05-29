const { v4: uuidv4 } = require("uuid");
const Ajv = require("ajv");
const ValidationError = require("../validation/validation_error.js");

const {
  asData,
  isBoolean,
  isInteger,
  isString,
  isDate,
  isBinary
} = require("../validation/fun.js");

const isValidType = (v) =>
  (isBoolean(v) || isInteger(v) || isString(v) || isDate(v) || isBinary(v));

const RESERVED_ATTRIBUTES = {
  type: "type",
  specversion: "specversion",
  source: "source",
  id: "id",
  time: "time",
  dataschema: "dataschema",
  datacontenttype: "datacontenttype",
  subject: "subject",
  data: "data",
  data_base64: "data_base64"
};

const schema = {
  $ref: "#/definitions/event",
  definitions: {
    specversion: {
      type: "string",
      minLength: 1,
      const: "1.0"
    },
    datacontenttype: {
      type: "string"
    },
    data: {
      type: ["object", "string"]
    },
    data_base64: {
      type: "string"
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
        data_base64: {
          $ref: "#/definitions/data_base64"
        },
        id: {
          $ref: "#/definitions/id"
        },
        time: {
          $ref: "#/definitions/time"
        },
        dataschema: {
          $ref: "#/definitions/dataschema"
        },
        subject: {
          $ref: "#/definitions/subject"
        },
        type: {
          $ref: "#/definitions/type"
        },
        source: {
          $ref: "#/definitions/source"
        }
      },
      required: ["specversion", "id", "type", "source"],
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
    dataschema: {
      type: "string",
      format: "uri"
    },
    subject: {
      type: "string",
      minLength: 1
    },
    type: {
      type: "string",
      minLength: 1
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
 * Decorates a CloudEvent with the 1.0 specification getters and setters
 * @ignore
 */
class Spec1 {
  constructor() {
    this.payload = {
      specversion: schema.definitions.specversion.const,
      id: uuidv4(),
      time: new Date().toISOString()
    };
    Object.freeze(this);
  }

  check() {
    if (!isValidAgainstSchema(this.payload)) {
      throw new ValidationError("invalid payload", isValidAgainstSchema.errors);
    }
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

  set dataSchema(schema) {
    this.payload.dataSchema = schema;
  }

  get dataSchema() {
    return this.payload.dataSchema;
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

    if (dct) {
      this.payload.data = asData(this.payload.data, dct);
    }

    return this.payload.data;
  }

  addExtension(key, value) {
    if (!Object.prototype.hasOwnProperty.call(RESERVED_ATTRIBUTES, key)) {
      if (isValidType(value)) {
        this.payload[key] = value;
      } else {
        throw new ValidationError("Invalid type of extension value");
      }
    } else {
      throw new ValidationError(`Reserved attribute name: '${key}'`);
    }
    return this;
  }
}

module.exports = Spec1;
