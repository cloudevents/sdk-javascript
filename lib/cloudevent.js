const Spec = require("./specs/spec_1.js");
const Formatter = require("./formats/json/formatter.js");

/*
 * Class created using the Builder Design Pattern.
 *
 * https://en.wikipedia.org/wiki/Builder_pattern
 */
function Cloudevent(_spec, _formatter) {
  this.spec = (_spec) ? new _spec(Cloudevent) : new Spec(Cloudevent);
  this.formatter = (_formatter) ? new _formatter() : new Formatter();

  // The map of extensions
  this.extensions = {};
}

/*
 * To format the payload using the formatter
 */
Cloudevent.prototype.format = function() {
  // Check the constraints
  this.spec.check();

  // To run asData()
  this.getData();

  // Then, format
  return this.formatter.format(this.spec.payload);
};

Cloudevent.prototype.toString = function() {
  return this.formatter.toString(this.spec.payload);
};

Cloudevent.prototype.type = function(type) {
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

Cloudevent.prototype.source = function(_source) {
  this.spec.source(_source);
  return this;
};

Cloudevent.prototype.getSource = function() {
  return this.spec.getSource();
};

Cloudevent.prototype.id = function(_id) {
  this.spec.id(_id);
  return this;
};

Cloudevent.prototype.getId = function() {
  return this.spec.getId();
};

Cloudevent.prototype.time = function(_time) {
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

Cloudevent.prototype.dataContenttype = function(_contenttype) {
  this.spec.dataContenttype(_contenttype);
  return this;
};

Cloudevent.prototype.getDataContenttype = function() {
  return this.spec.getDataContenttype();
};

Cloudevent.prototype.data = function(_data) {
  this.spec.data(_data);
  return this;
};

Cloudevent.prototype.getData = function() {
  return this.spec.getData();
};

Cloudevent.prototype.addExtension = function(key, value) {
  this.spec.addExtension(key, value);

  // Stores localy
  this.extensions[key] = value;

  return this;
};

Cloudevent.prototype.getExtensions = function() {
  return this.extensions;
};

/*
 * Export the formats
 */
Cloudevent.formats = {
  json: Formatter,
  "json0.1": Formatter
};

module.exports = Cloudevent;
