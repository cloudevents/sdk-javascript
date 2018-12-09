var uuid  = require('uuid/v4');
var empty = require('is-empty')

function Spec_0_2(){
  this.payload = {
    specversion: '0.2',
    id: uuid()
  };
}

/*
 * Check the spec constraints.
 */
Spec_0_2.prototype.check = function(){

  if(empty(this.payload['type'])) {
    throw {message: "'type' is invalid"};
  }

  if(empty(this.payload['specversion'])) {
    throw {message: "'specversion' is invalid"};
  }

  if(this.payload['specversion'] !== '0.2') {
    throw {message: "'specversion' value is invalid: '" 
      + this.payload['specversion'] + "'"};
  }

  if(empty(this.payload['id'])) {
    throw {message: "'id' is invalid"};
  }
}

Spec_0_2.prototype.type = function(_type){
  this.payload['type'] = _type;
  return this;
}

Spec_0_2.prototype.source = function(_source){
  this.payload['source'] = _source;
  return this;
}

Spec_0_2.prototype.id = function(_id){
  this.payload['id'] = _id;
  return this;
}

Spec_0_2.prototype.time = function(_time){
  this.payload['time'] = _time.toISOString();
  return this;
}

Spec_0_2.prototype.schemaurl = function(_schemaurl){
  this.payload['schemaurl'] = _schemaurl;
  return this;
}

Spec_0_2.prototype.contenttype = function(_contenttype){
  this.payload['contenttype'] = _contenttype;
  return this;
}

Spec_0_2.prototype.data = function(_data){
  this.payload['data'] = _data;
  return this;
}

Spec_0_2.prototype.addExtension = function(key, value){
  this.payload[key] = value;
  return this;
}

module.exports = Spec_0_2;

