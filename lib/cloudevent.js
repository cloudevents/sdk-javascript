var Spec01           = require("./specs/spec_0_1.js");
var Spec02           = require("./specs/spec_0_2.js");
var JSONFormatter01  = require("./formats/json/formatter.js");
var HTTPStructured01 = require("./bindings/http/emitter_structured_0_1.js");
var HTTPStructured02 = require("./bindings/http/emitter_structured_0_2.js");
var HTTPBinary01     = require("./bindings/http/emitter_binary_0_1.js");
var {HTTPBinary02}   = require("./bindings/http/emitter_binary_0_2.js");

/*
 * Class created using the Builder Design Pattern.
 *
 * https://en.wikipedia.org/wiki/Builder_pattern
 */
function Cloudevent(_spec, _formatter){
  this.spec      = (_spec) ? new _spec(Cloudevent) : new Spec01(Cloudevent);
  this.formatter = (_formatter) ? _formatter : new JSONFormatter01();

  // The map of extensions
  this.extensions = {};
}

/*
 * To format the payload using the formatter
 */
Cloudevent.prototype.format = function(){
  // Check the constraints
  this.spec.check();

  // To run asData()
  this.getData();

  // Then, format
  return this.formatter.format(this.spec.payload);
};

Cloudevent.prototype.toString = function(){
  return this.formatter.toString(this.spec.payload);
};

Cloudevent.prototype.type = function(type){
  this.spec.type(type);
  return this;
};

Cloudevent.prototype.getType = function() {
  return this.spec.getType();
};

Cloudevent.prototype.specversion = function(version) {
  return this.spec.specversion(version);
};

Cloudevent.prototype.getSpecversion = function() {
  return this.spec.getSpecversion();
};

Cloudevent.prototype.source = function(_source){
  this.spec.source(_source);
  return this;
};

Cloudevent.prototype.getSource = function(){
  return this.spec.getSource();
};

Cloudevent.prototype.id = function(_id){
  this.spec.id(_id);
  return this;
};

Cloudevent.prototype.getId = function() {
  return this.spec.getId();
};

Cloudevent.prototype.time = function(_time){
  this.spec.time(_time);
  return this;
};

Cloudevent.prototype.getTime = function() {
  return this.spec.getTime();
};

Cloudevent.prototype.schemaurl = function(_schemaurl) {
  this.spec.schemaurl(_schemaurl);
  return this;
};

Cloudevent.prototype.getSchemaurl = function() {
  return this.spec.getSchemaurl();
};

Cloudevent.prototype.contenttype = function(_contenttype){
  this.spec.contenttype(_contenttype);
  return this;
};

Cloudevent.prototype.getContenttype = function() {
  return this.spec.getContenttype();
};

Cloudevent.prototype.data = function(_data) {
  this.spec.data(_data);
  return this;
};

Cloudevent.prototype.getData = function() {
  return this.spec.getData();
};

Cloudevent.prototype.addExtension = function(key, value){
  this.spec.addExtension(key, value);

  // Stores localy
  this.extensions[key] = value;

  return this;
};

Cloudevent.prototype.getExtensions = function() {
  return this.extensions;
};


/*
 * Export the specs
 */
Cloudevent.specs = {
  "0.1": Spec01,
  "0.2": Spec02
};

/*
 * Export the formats
 */
Cloudevent.formats = {
  "json"   : JSONFormatter01,
  "json0.1": JSONFormatter01
};

Cloudevent.bindings = {
  "http-structured"    : HTTPStructured01,
  "http-structured0.1" : HTTPStructured01,
  "http-structured0.2" : HTTPStructured02,
  "http-binary0.1"     : HTTPBinary01,
  "http-binary0.2"     : HTTPBinary02
};

module.exports = Cloudevent;
