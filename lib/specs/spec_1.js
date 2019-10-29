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
}

Spec1.prototype.id = function(_id){
  this.payload["id"] = _id;
  return this;
};

module.exports = Spec1;
