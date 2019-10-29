const uuid  = require("uuid/v4");
const empty = require("is-empty");
const Ajv   = require("ajv");

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
  }
  this.caller.prototype.getDataschema = function() {
    return this.spec.getDataschema();
  }

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
}

Spec1.prototype.id = function(_id){
  this.payload["id"] = _id;
  return this;
};

Spec1.prototype.getId = () => {
  return this.payload["id"];
};

module.exports = Spec1;
