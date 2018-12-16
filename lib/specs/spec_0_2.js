var uuid  = require("uuid/v4");
var empty = require("is-empty");

function Spec02(){
  this.payload = {
    specversion: "0.2",
    id: uuid()
  };
}

/*
 * Check the spec constraints.
 */
Spec02.prototype.check = function(){

  if(empty(this.payload["type"])) {
    throw {message: "'type' is invalid"};
  }

  if(empty(this.payload["specversion"])) {
    throw {message: "'specversion' is invalid"};
  }

  if(this.payload["specversion"] !== "0.2") {
    throw {message: "'specversion' value is invalid: '"
      + this.payload["specversion"] + "'"};
  }

  if(empty(this.payload["id"])) {
    throw {message: "'id' is invalid"};
  }
};

Spec02.prototype.type = function(_type){
  this.payload["type"] = _type;
  return this;
};

Spec02.prototype.getType = function(){
  return this.payload["type"];
};

Spec02.prototype.getSpecversion = function() {
  return this.payload["specversion"];
};

Spec02.prototype.source = function(_source){
  this.payload["source"] = _source;
  return this;
};

Spec02.prototype.id = function(_id){
  this.payload["id"] = _id;
  return this;
};

Spec02.prototype.time = function(_time){
  this.payload["time"] = _time.toISOString();
  return this;
};

Spec02.prototype.schemaurl = function(_schemaurl){
  this.payload["schemaurl"] = _schemaurl;
  return this;
};

Spec02.prototype.contenttype = function(_contenttype){
  this.payload["contenttype"] = _contenttype;
  return this;
};

Spec02.prototype.getContenttype = function() {
  return this.payload["contenttype"];
}

Spec02.prototype.data = function(_data){
  this.payload["data"] = _data;
  return this;
};

Spec02.prototype.getData = function() {
  return this.payload["data"];
};

Spec02.prototype.addExtension = function(key, value){
  this.payload[key] = value;
  return this;
};

module.exports = Spec02;
