var Spec_0_1          = require('./specs/spec_0_1.js');
var Spec_0_2          = require('./specs/spec_0_2.js');
var JSONFormatter_0_1 = require('./formats/json_0_1.js');

function Cloudevent(_spec, _formatter){
  this.spec      = (_spec) ? new _spec(Cloudevent) : new Spec_0_1(Cloudevent);
  this.formatter = (_formatter) ? _formatter : new JSONFormatter_0_1();
}

Cloudevent.prototype.format = function(){
  return this.formatter.format(this.spec.payload);
}

Cloudevent.prototype.toString = function(){
  return this.formatter.toString(this.spec.payload);
}

Cloudevent.prototype.type = function(type){
  this.spec.type(type);
  return this;
}

Cloudevent.prototype.source = function(_source){
  this.spec.source(_source);
  return this;
}

Cloudevent.specs = {
  '0.1': Spec_0_1,
  '0.2': Spec_0_2
};

module.exports = Cloudevent;

