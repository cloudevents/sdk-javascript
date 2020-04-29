const Spec = require("./specs/spec_1.js");
const Formatter = require("./formats/json/formatter.js");

/*
 * Class created using the Builder Design Pattern.
 *
 * https://en.wikipedia.org/wiki/Builder_pattern
 */
class CloudEvent {
  constructor(_spec, _formatter) {
    this.spec = (_spec) ? new _spec(CloudEvent) : new Spec(CloudEvent);
    this.formatter = (_formatter) ? new _formatter() : new Formatter();

    // The map of extensions
    this.extensions = {};
  }

  getFormats() {
    return { json: Formatter };
  }

  format() {
    // Check the constraints
    this.spec.check();

    // To run asData()
    this.getData();

    // Then, format
    return this.formatter.format(this.spec.payload);
  }

  toString() {
    return this.formatter.toString(this.spec.payload);
  }

  type(type) {
    this.spec.type(type);
    return this;
  }

  getType() {
    return this.spec.getType();
  }

  specversion(version) {
    return this.spec.specversion(version);
  }

  getSpecversion() {
    return this.spec.getSpecversion();
  }

  source(_source) {
    this.spec.source(_source);
    return this;
  }

  getSource() {
    return this.spec.getSource();
  }

  id(_id) {
    this.spec.id(_id);
    return this;
  }

  getId() {
    return this.spec.getId();
  }

  time(_time) {
    this.spec.time(_time);
    return this;
  }

  getTime() {
    return this.spec.getTime();
  }

  schemaurl(_schemaurl) {
    this.spec.schemaurl(_schemaurl);
    return this;
  }

  getSchemaurl() {
    return this.spec.getSchemaurl();
  }

  dataContenttype(_contenttype) {
    this.spec.dataContenttype(_contenttype);
    return this;
  }

  getDataContenttype() {
    return this.spec.getDataContenttype();
  }

  data(_data) {
    this.spec.data(_data);
    return this;
  }

  getData() {
    return this.spec.getData();
  }

  addExtension(key, value) {
    this.spec.addExtension(key, value);

    // Stores locally
    this.extensions[key] = value;

    return this;
  }

  getExtensions() {
    return this.extensions;
  }
}

module.exports = CloudEvent;
