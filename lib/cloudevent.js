var Spec_0_1           = require('./specs/spec_0_1.js');
var Spec_0_2           = require('./specs/spec_0_2.js');
var JSONFormatter_0_1  = require('./formats/json_0_1.js');
var HTTPStructured_0_1 = require('./bindings/http/structured_0_1.js');

/*
 * Class created using the Builder Design Pattern.
 *
 * https://en.wikipedia.org/wiki/Builder_pattern
 */
function Cloudevent(_spec, _formatter){
  this.spec      = (_spec) ? new _spec(Cloudevent) : new Spec_0_1(Cloudevent);
  this.formatter = (_formatter) ? _formatter : new JSONFormatter_0_1();
}

/*
 * To format the payload using the formatter
 */
Cloudevent.prototype.format = function(){
  // Check the constraints
  this.spec.check();

  // Then, format
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

Cloudevent.prototype.id = function(_id){
  this.spec.id(_id);
  return this;
}

Cloudevent.prototype.time = function(_time){
  this.spec.time(_time);
  return this;
}

/*
 * Export the specs
 */
Cloudevent.specs = {
  '0.1': Spec_0_1,
  '0.2': Spec_0_2
};

/*
 * Export the formats
 */
Cloudevent.formats = {
  'json'   : JSONFormatter_0_1,
  'json0.1': JSONFormatter_0_1
};

Cloudevent.bindings = {
  'http-structured'    : HTTPStructured_0_1,
  'http-structured0.1' : HTTPStructured_0_1
};

module.exports = Cloudevent;

