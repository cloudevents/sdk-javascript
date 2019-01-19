var uuid = require("uuid/v4");

function Spec01(_caller){
  this.payload = {
    cloudEventsVersion: "0.1",
    eventID: uuid()
  };

  /*
   * Used to inject backward compatibility functions or attributes.
   */
  this.caller = _caller;

  /*
   * Inject the method to set the version related to data attribute.
   */
  this.caller.prototype.eventTypeVersion = function(_version){
    return this.spec.eventTypeVersion(_version);
  };

  this.caller.prototype.getEventTypeVersion = function(){
    return this.spec.getEventTypeVersion();
  };
}

/*
 * Check the constraints.
 *
 * throw an error if do not pass.
 */
Spec01.prototype.check = function() {

  if(!this.payload["eventType"]){
    throw {message: "'eventType' is invalid"};
  }

};

Spec01.prototype.type = function(_type){
  this.payload["eventType"] = _type;
  return this;
};

Spec01.prototype.getType = function(){
  return this.payload["eventType"];
};

Spec01.prototype.getSpecversion = function() {
  return this.payload["cloudEventsVersion"];
};

Spec01.prototype.eventTypeVersion = function(version){
  this.payload["eventTypeVersion"] = version;
  return this;
};

Spec01.prototype.getEventTypeVersion = function() {
  return this.payload["eventTypeVersion"];
};

Spec01.prototype.source = function(_source){
  this.payload["source"] = _source;
  return this;
};

Spec01.prototype.getSource = function() {
  return this.payload["source"];
};

Spec01.prototype.id = function(_id){
  this.payload["eventID"] = _id;
  return this;
};

Spec01.prototype.getId = function() {
  return this.payload["eventID"];
};

Spec01.prototype.time = function(_time){
  this.payload["eventTime"] = _time.toISOString();
  return this;
};

Spec01.prototype.getTime = function() {
  return this.payload["eventTime"];
};

Spec01.prototype.schemaurl = function(_schemaurl){
  this.payload["schemaURL"] = _schemaurl;
  return this;
};

Spec01.prototype.getSchemaurl = function() {
  return this.payload["schemaURL"];
};

Spec01.prototype.contenttype = function(_contenttype){
  this.payload["contentType"] = _contenttype;
  return this;
};

Spec01.prototype.getContenttype = function() {
  return this.payload["contentType"];
};

Spec01.prototype.data = function(_data){
  this.payload["data"] = _data;
  return this;
};

Spec01.prototype.getData = function() {
  return this.payload["data"];
};

Spec01.prototype.addExtension = function(key, value){
  if(!this.payload["extensions"]){
    this.payload["extensions"] = {};
  }
  this.payload["extensions"][key] = value;
  return this;
};

module.exports = Spec01;
