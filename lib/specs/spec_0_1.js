var uuid = require('uuid/v4');

function Spec_0_1(_caller){
  this.payload = {
    cloudEventsVersion: '0.1',
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
    this.spec.eventTypeVersion(_version);
  }
}

/*
 * Check the constraints.
 *
 * throw an error if do not pass.
 */
Spec_0_1.prototype.check = function() {

  if(!this.payload['eventType']){
    throw {message: "'eventType' is invalid"};
  }

}

Spec_0_1.prototype.type = function(_type){
  this.payload['eventType'] = _type;
  return this;
}

Spec_0_1.prototype.eventTypeVersion = function(version){
  this.payload['eventTypeVersion'] = version;
  return this;
}

Spec_0_1.prototype.source = function(_source){
  this.payload['source'] = _source;
  return this;
}

Spec_0_1.prototype.id = function(_id){
  this.payload['eventID'] = _id;
  return this;
}

Spec_0_1.prototype.time = function(_time){
  this.payload['eventTime'] = _time.toISOString();
  return this;
}

//TODO another attributes . . .

module.exports = Spec_0_1;

