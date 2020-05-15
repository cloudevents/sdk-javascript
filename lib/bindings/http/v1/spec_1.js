const { v4: uuidv4 } = require("uuid");
const Ajv = require("ajv");
const ValidationError = require("../validation/validation_error.js");

const {
  asData,
  isBoolean,
  isInteger,
  isString,
  isDate,
  isBinary,
  clone
} = require("../validation/fun.js");

const isValidType = (v) =>
  (isBoolean(v) || isInteger(v) || isString(v) || isDate(v) || isBinary(v));

const RESERVED_ATTRIBUTES = {
  type: "type",
  specversion: "specversion",
  source: "source",
  id: "id",
  time: "time",
  dataschema: "schemaurl",
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

function Spec1(_caller) {
  this.payload = {
    specversion: schema.definitions.specversion.const,
    id: uuidv4()
  };

  if (!_caller) {
    _caller = require("../../../cloudevent.js");
  }

  /*
   * Used to inject compatibility methods or attributes
   */
  this.caller = _caller;

  // dataschema attribute
  this.caller.prototype.dataschema = function(dataschema) {
    this.spec.dataschema(dataschema);
    return this;
  };
  this.caller.prototype.getDataschema = function() {
    return this.spec.getDataschema();
  };

  // datacontenttype attribute
  this.caller.prototype.dataContentType = function(contentType) {
    this.spec.dataContentType(contentType);
    return this;
  };
  this.caller.prototype.getDataContentType = function() {
    return this.spec.getDataContentType();
  };

  // subject attribute
  this.caller.prototype.subject = function(_subject) {
    this.spec.subject(_subject);
    return this;
  };
  this.caller.prototype.getSubject = function() {
    return this.spec.getSubject();
  };

  // format() method override
  this.caller.prototype.format = function() {
    // Check the constraints
    this.spec.check();

    // Check before getData() call
    const isbin = isBinary(this.spec.payload[RESERVED_ATTRIBUTES.data]);

    // May be used, if isbin==true
    const payload = clone(this.spec.payload);

    // To run asData()
    this.getData();

    // Handle when is binary, creating the data_base64
    if (isbin) {
      payload[RESERVED_ATTRIBUTES.data_base64] =
        this.spec.payload[RESERVED_ATTRIBUTES.data];
      delete payload[RESERVED_ATTRIBUTES.data];

      return this.formatter.format(payload);
    }

    // Then, format
    return this.formatter.format(this.spec.payload);
  };
}

/*
 * Check the spec constraints
 */
Spec1.prototype.check = function(ce) {
  const toCheck = (!ce ? this.payload : ce);

  if (!isValidAgainstSchema(toCheck)) {
    throw new ValidationError("invalid payload", [isValidAgainstSchema.errors]);
  }
};

Spec1.prototype.id = function(_id) {
  this.payload.id = _id;
  return this;
};

Spec1.prototype.getId = function() {
  return this.payload.id;
};

Spec1.prototype.source = function(_source) {
  this.payload.source = _source;
  return this;
};

Spec1.prototype.getSource = function() {
  return this.payload.source;
};

Spec1.prototype.specversion = function() {
  // does not set! This is right
  return this;
};

Spec1.prototype.getSpecversion = function() {
  return this.payload.specversion;
};

Spec1.prototype.type = function(_type) {
  this.payload.type = _type;
  return this;
};

Spec1.prototype.getType = function() {
  return this.payload.type;
};

Spec1.prototype.dataContentType = function(_contenttype) {
  this.payload.datacontenttype = _contenttype;
  return this;
};
Spec1.prototype.getDataContentType = function() {
  return this.payload.datacontenttype;
};

Spec1.prototype.dataschema = function(_schema) {
  this.payload.dataschema = _schema;
  return this;
};
Spec1.prototype.getDataschema = function() {
  return this.payload.dataschema;
};

Spec1.prototype.subject = function(_subject) {
  this.payload.subject = _subject;
  return this;
};
Spec1.prototype.getSubject = function() {
  return this.payload.subject;
};

Spec1.prototype.time = function(_time) {
  this.payload.time = _time.toISOString();
  return this;
};
Spec1.prototype.getTime = function() {
  return this.payload.time;
};

Spec1.prototype.data = function(_data) {
  this.payload.data = _data;
  return this;
};
Spec1.prototype.getData = function() {
  const dct = this.payload.datacontenttype;

  if (dct) {
    this.payload.data = asData(this.payload.data, dct);
  }

  return this.payload.data;
};

Spec1.prototype.addExtension = function(key, value) {
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
};

module.exports = Spec1;
