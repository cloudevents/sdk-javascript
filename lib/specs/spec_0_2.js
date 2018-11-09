var uuid = require('uuid/v4');

function Spec_0_2(){
  this.payload = {
    specversion: '0.2',
    id: uuid()
  };
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

module.exports = Spec_0_2;

