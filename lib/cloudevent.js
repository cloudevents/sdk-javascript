const Spec = require("./bindings/http/v1/spec_1.js");
const Formatter = require("./formats/json/formatter.js");

/**
 * An instance of a CloudEvent.
 */
class CloudEvent {
  /**
   * Creates a new CloudEvent instance
   * @param {Spec} [userSpec] A CloudEvent version specification
   * @param {Formatter} [userFormatter] Converts the event into a readable string
   */
  constructor(userSpec, userFormatter) {
    // @ts-ignore Type 'Spec1' has no construct signatures.
    this.spec = (userSpec) ? new userSpec(CloudEvent) : new Spec(CloudEvent);
    // @ts-ignore Type 'JSONFormatter' has no construct signatures.
    this.formatter = (userFormatter) ? new userFormatter() : new Formatter();

    // The map of extensions
    this.extensions = {};
  }

  /**
   * Get the formatters available to this CloudEvent
   * @returns {Object} a JSON formatter
   */
  getFormats() {
    return { json: Formatter };
  }

  /**
   * Formats the CloudEvent as JSON. Validates the event according
   * to the CloudEvent specification and throws an exception if
   * it's invalid.
   * @returns {JSON} the CloudEvent in JSON form
   */
  format() {
    // Check the constraints
    this.spec.check();

    // To run asData()
    this.getData();

    // Then, format
    return this.formatter.format(this.spec.payload);
  }

  /**
   * Formats the CLoudEvent as JSON. No specification validation
   * is performed.
   * @returns {JSON} the CloudEvent in JSON form
   */
  toString() {
    return this.formatter.toString(this.spec.payload);
  }

  /**
   * Sets the event type
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#type
   * @param {string} type the type of event related to the originating source
   * @returns {CloudEvent} this CloudEvent
   */
  type(type) {
    this.spec.type(type);
    return this;
  }

  /**
   * Gets the event type
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#type
   * @returns {String} the type of event related to the originating source
   */
  getType() {
    return this.spec.getType();
  }

  // TODO: The fact that this is exposed is problematic, given that it's
  // immutable and this method will have no effect. The specification
  // version is determined via the constructor - specifically the use
  // of cloud event creator functions in /v03 and /v1. By default this
  // object is created as a version 1.0 CloudEvent. Not documenting.
  specversion(version) {
    return this.spec.specversion(version);
  }

  /**
   * Gets the CloudEvent specification version
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#specversion
   * @returns {string} The CloudEvent version that this event adheres to
   */
  getSpecversion() {
    return this.spec.getSpecversion();
  }

  /**
   * Sets the origination source of this event.
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#source-1
   * @param {string} source the context in which the event happened in URI form
   * @returns {CloudEvent} this CloudEvent instance
   */
  source(source) {
    this.spec.source(source);
    return this;
  }

  /**
   * Gets the origination source of this event.
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#source-1
   * @returns {string} the event source
   */
  getSource() {
    return this.spec.getSource();
  }

  /**
   * Sets the event id. Source + id must be unique for each distinct event.
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#id
   * @param {string} id source+id must be unique for each distinct event
   * @returns {CloudEvent} this CloudEvent instance
   */
  id(id) {
    this.spec.id(id);
    return this;
  }

  /**
   * Gets the event id.
   * @returns {string} the event id
   */
  getId() {
    return this.spec.getId();
  }

  /**
   * Sets the timestamp for this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#time
   * @param {Date} time timestamp when the event occurred
   * @returns {CloudEvent} this CloudEvent instance
   */
  time(time) {
    // TODO: Ensure that this is represented as a Date internally,
    // or update the JSDoc
    this.spec.time(time);
    return this;
  }

  /**
   * Gets the timestamp for this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#time
   * @returns {Date} the timestamp for this event
   */
  getTime() {
    // TODO: Ensure that this is represented as a Date internally,
    // or update the JSDoc
    return this.spec.getTime();
  }

  // TODO: Deprecated in 1.0
  schemaurl(schemaurl) {
    this.spec.schemaurl(schemaurl);
    return this;
  }

  // TODO: Deprecated in 1.0
  getSchemaurl() {
    return this.spec.getSchemaurl();
  }

  /**
   * Sets the content type of the data value for this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#datacontenttype
   * @param {string} contenttype per https://tools.ietf.org/html/rfc2046
   * @returns {CloudEvent} this CloudEvent instance
   */
  dataContenttype(contenttype) {
    this.spec.dataContenttype(contenttype);
    return this;
  }

  /**
   * Gets the content type of the data value for this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#datacontenttype
   * @returns {string} the content type for the data in this event
   */
  getDataContenttype() {
    return this.spec.getDataContenttype();
  }

  /**
   * Sets the data for this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#event-data
   * @param {*} data any data associated with this event
   * @returns {CloudEvent} this CloudEvent instance
   */
  data(data) {
    this.spec.data(data);
    return this;
  }

  /**
   * Gets any data that has been set for this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#event-data
   * @returns {*} any data set for this event
   */
  getData() {
    return this.spec.getData();
  }

  /**
   * Adds an extension attribute to this CloudEvent
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#extension-context-attributes
   * @param {*} key the name of the extension attribute
   * @param {*} value the value of the extension attribute
   * @returns {CloudEvent} this CloudEvent instance
   */
  addExtension(key, value) {
    this.spec.addExtension(key, value);

    // Stores locally
    this.extensions[key] = value;

    return this;
  }

  /**
   * Gets the extension attributes, if any, associated with this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#extension-context-attributes
   * @returns {Object} the extensions attributes - if none exist will will be {}
   * // TODO - this should return null or undefined if no extensions
   */
  getExtensions() {
    return this.extensions;
  }
}

module.exports = CloudEvent;
