var uuid  = require("uuid/v4");
var empty = require("is-empty");
var Ajv   = require("ajv");

// Reserved attributes names
const reserved = {
  type: "type",
  specversion: "specversion",
  source: "source",
  id: "id",
  time: "time",
  schemaurl: "schemaurl",
  contenttype: "contenttype",
  data: "data"
};

const schema = require("../../ext/spec_0_2.json");

const ajv = new Ajv({
  extendRefs: true //  validate all keywords in the schemas with $ref (the default behaviour in versions before 5.0.0)
});

const validate = ajv.compile(schema);

function Spec02(){
  this.payload = {
    specversion: "0.2",
    id: uuid()
  };
}

/*
 * Check the spec constraints
 */
Spec02.prototype.check = function(ce){
  var toCheck = ce;
  if(!toCheck) {
    toCheck = this.payload;
  }
  var valid = validate(toCheck);

  if(!valid) {
    throw {message: "invalid payload", errors: validate.errors};
  }
};

Spec02.prototype.type = function(_type){
  this.payload["type"] = _type;
  return this;
};

Spec02.prototype.getType = function(){
  return this.payload["type"];
};

Spec02.prototype.specversion = function(_specversion){
  // does not set! This is right
  return this;
};

Spec02.prototype.getSpecversion = function() {
  return this.payload["specversion"];
};

Spec02.prototype.source = function(_source){
  this.payload["source"] = _source;
  return this;
};

Spec02.prototype.getSource = function() {
  return this.payload["source"];
};

Spec02.prototype.id = function(_id){
  this.payload["id"] = _id;
  return this;
};

Spec02.prototype.getId = function() {
  return this.payload["id"];
};

Spec02.prototype.time = function(_time){
  this.payload["time"] = _time.toISOString();
  return this;
};

Spec02.prototype.getTime = function() {
  return this.payload["time"];
};

Spec02.prototype.schemaurl = function(_schemaurl){
  this.payload["schemaurl"] = _schemaurl;
  return this;
};

Spec02.prototype.getSchemaurl = function() {
  return this.payload["schemaurl"];
};

Spec02.prototype.contenttype = function(_contenttype){
  this.payload["contenttype"] = _contenttype;
  return this;
};

Spec02.prototype.getContenttype = function() {
  return this.payload["contenttype"];
};

Spec02.prototype.data = function(_data){
  this.payload["data"] = _data;
  return this;
};

Spec02.prototype.getData = function() {
  return this.payload["data"];
};

Spec02.prototype.addExtension = function(key, value){
  if(!reserved.hasOwnProperty(key)){
    this.payload[key] = value;
  } else {
    throw {message: "Reserved attribute name: '" + key + "'"};
  }
  return this;
};

module.exports = Spec02;
