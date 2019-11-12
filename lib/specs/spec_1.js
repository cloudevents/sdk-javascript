const uuid  = require("uuid/v4");
const empty = require("is-empty");
const Ajv   = require("ajv");
const URI   = require("uri-js");

const {
  asData,
  isBoolean,
  isInteger,
  isString,
  isDate,
  isBinary,
  clone
} = require("../utils/fun.js");

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
  subject : "subject",
  data: "data",
  data_base64: "data_base64"
};

const schema = require("../../ext/spec_1.json");

const ajv = new Ajv({
  extendRefs: true
});

const isValidAgainstSchema = ajv.compile(schema);

function Spec1(_caller) {
  this.payload = {
    specversion: "1.0",
    id: uuid()
  };

  if(!_caller){
    _caller = require("../cloudevent.js");
  }

  /*
   * Used to inject compatibility methods or attributes
   */
  this.caller = _caller;

  // dataschema attribute
  this.caller.prototype.dataschema = function(dataschema){
    this.spec.dataschema(dataschema);
    return this;
  };
  this.caller.prototype.getDataschema = function() {
    return this.spec.getDataschema();
  };

  // datacontenttype attribute
  this.caller.prototype.dataContentType = function(contentType){
    this.spec.dataContentType(contentType);
    return this;
  };
  this.caller.prototype.getDataContentType = function(){
   return this.spec.getDataContentType();
  };

  // subject attribute
  this.caller.prototype.subject = function(_subject){
    this.spec.subject(_subject);
    return this;
  };
  this.caller.prototype.getSubject = function(){
   return this.spec.getSubject();
  };

  // format() method override
  this.caller.prototype.format = function(){
    // Check the constraints
    this.spec.check();

    // Check before getData() call
    let isbin = isBinary(this.spec.payload[RESERVED_ATTRIBUTES.data]);

    // May be used, if isbin==true
    let payload = clone(this.spec.payload);

    // To run asData()
    this.getData();

    // Handle when is binary, creating the data_base64
    if(isbin) {
      payload[RESERVED_ATTRIBUTES.data_base64] = this.spec.payload[RESERVED_ATTRIBUTES.data];
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
Spec1.prototype.check = function(ce){
  var toCheck = (!ce ? this.payload : ce);

  if(!isValidAgainstSchema(toCheck)) {
    throw {message: "invalid payload", errors: isValidAgainstSchema.errors};
  }
};

Spec1.prototype.id = function(_id){
  this.payload["id"] = _id;
  return this;
};

Spec1.prototype.getId = function() {
  return this.payload["id"];
};

Spec1.prototype.source = function(_source){
  this.payload["source"] = _source;
  return this;
};

Spec1.prototype.getSource = function() {
  return this.payload["source"];
};

Spec1.prototype.specversion = function(_specversion){
  // does not set! This is right
  return this;
};

Spec1.prototype.getSpecversion = function() {
  return this.payload["specversion"];
};

Spec1.prototype.type = function(_type){
  this.payload["type"] = _type;
  return this;
};

Spec1.prototype.getType = function(){
  return this.payload["type"];
};

Spec1.prototype.dataContentType = function(_contenttype){
  this.payload["datacontenttype"] = _contenttype;
  return this;
};
Spec1.prototype.getDataContentType = function() {
  return this.payload["datacontenttype"];
};

Spec1.prototype.dataschema = function(_schema){
  this.payload["dataschema"] = _schema;
  return this;
};
Spec1.prototype.getDataschema = function() {
  return this.payload["dataschema"];
};

Spec1.prototype.subject = function(_subject){
  this.payload["subject"] = _subject;
  return this;
};
Spec1.prototype.getSubject = function() {
  return this.payload["subject"];
};

Spec1.prototype.time = function(_time){
  this.payload["time"] = _time.toISOString();
  return this;
};
Spec1.prototype.getTime = function() {
  return this.payload["time"];
};

Spec1.prototype.data = function(_data){
  this.payload["data"] = _data;
  return this;
};
Spec1.prototype.getData = function() {
  let dct = this.payload["datacontenttype"];

  if(dct){
    this.payload["data"] = asData(this.payload["data"], dct);
  }

  return this.payload["data"];
};

Spec1.prototype.addExtension = function(key, value){
  if(!RESERVED_ATTRIBUTES.hasOwnProperty(key)){
    if(isValidType(value)){
      this.payload[key] = value;
    } else {
      throw {message: "Invalid type of extension value"};
    }
  } else {
    throw {message: "Reserved attribute name: '" + key + "'"};
  }
  return this;
};

module.exports = Spec1;
