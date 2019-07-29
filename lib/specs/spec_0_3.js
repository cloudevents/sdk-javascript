const uuid  = require("uuid/v4");
const empty = require("is-empty");
const Ajv   = require("ajv");

// Reserved attributes names
const reserved = {
  type: "type",
  specversion: "specversion",
  source: "source",
  id: "id",
  time: "time",
  schemaurl: "schemaurl",
  datacontentencoding: "datacontentencoding",
  datacontenttype: "datacontenttype",
  subject : "subject",
  data: "data"
};

const schema = require("../../ext/spec_0_3.json");

const ajv = new Ajv({
  extendRefs: true
});

const validate = ajv.compile(schema);

function Spec03(_caller){
  this.payload = {
    specversion: "0.3",
    id: uuid()
  };

  /*
   * Used to inject compatibility methods or attributes
   */
  this.caller = _caller;

  /*
   * Inject compatibility methods
   */
  this.caller.prototype.dataContentEncoding = function(encoding){
    this.spec.dataContentEncoding(encoding);
    return this;
  };
  this.caller.prototype.getDataContentEncoding = function(){
   return this.spec.getDataContentEncoding();
  };

  this.caller.prototype.dataContentType = function(contentType){
    this.spec.dataContentType(contentType);
    return this;
  };
  this.caller.prototype.getDataContentType = function(){
   return this.spec.getDataContentType();
  };

  this.caller.prototype.subject = function(_subject){
    this.spec.subject(_subject);
    return this;
  };
  this.caller.prototype.getSubject = function(){
   return this.spec.getSubject();
  };
}

/*
 * Check the spec constraints
 */
Spec03.prototype.check = function(ce){
  var toCheck = ce;
  if(!toCheck) {
    toCheck = this.payload;
  }
  var valid = validate(toCheck);

  if(!valid) {
    throw {message: "invalid payload", errors: validate.errors};
  }
};

Spec03.prototype.id = function(_id){
  this.payload["id"] = _id;
  return this;
};

Spec03.prototype.getId = function() {
  return this.payload["id"];
};

Spec03.prototype.source = function(_source){
  this.payload["source"] = _source;
  return this;
};

Spec03.prototype.getSource = function() {
  return this.payload["source"];
};

Spec03.prototype.specversion = function(_specversion){
  // does not set! This is right
  return this;
};

Spec03.prototype.getSpecversion = function() {
  return this.payload["specversion"];
};

Spec03.prototype.type = function(_type){
  this.payload["type"] = _type;
  return this;
};

Spec03.prototype.getType = function(){
  return this.payload["type"];
};

Spec03.prototype.dataContentEncoding = function(encoding) {
  this.payload["datacontentencoding"] = encoding;
  return this;
};

Spec03.prototype.getDataContentEncoding = function() {
  return this.payload["datacontentencoding"];
};

// maps to datacontenttype
Spec03.prototype.contenttype = function(_contenttype){
  this.payload["datacontenttype"] = _contenttype;
  return this;
};
Spec03.prototype.getContenttype = function() {
  return this.payload["datacontenttype"];
};

Spec03.prototype.dataContentType = function(_contenttype){
  this.payload["datacontenttype"] = _contenttype;
  return this;
};
Spec03.prototype.getDataContentType = function() {
  return this.payload["datacontenttype"];
};

Spec03.prototype.schemaurl = function(_schemaurl){
  this.payload["schemaurl"] = _schemaurl;
  return this;
};
Spec03.prototype.getSchemaurl = function() {
  return this.payload["schemaurl"];
};

Spec03.prototype.subject = function(_subject){
  this.payload["subject"] = _subject;
  return this;
};
Spec03.prototype.getSubject = function() {
  return this.payload["subject"];
};

Spec03.prototype.time = function(_time){
  this.payload["time"] = _time.toISOString();
  return this;
};
Spec03.prototype.getTime = function() {
  return this.payload["time"];
};

Spec03.prototype.data = function(_data){
  this.payload["data"] = _data;
  return this;
};
Spec03.prototype.getData = function() {
  return this.payload["data"];
};

Spec03.prototype.addExtension = function(key, value){
  if(!reserved.hasOwnProperty(key)){
    this.payload[key] = value;
  } else {
    throw {message: "Reserved attribute name: '" + key + "'"};
  }
  return this;
};

module.exports = Spec03;
