const GenericUnmarshaller = require("./unmarshaller.js");

var StructuredReceiver = require("./receiver_structured_0_2.js");
var BinaryReceiver     = require("./receiver_binary_0_2.js");

const RECEIVER_BY_BINDING = {
  structured : new StructuredReceiver(),
  binary     : new BinaryReceiver(),
};

var Unmarshaller = function() {
  this.unmarshaller = new GenericUnmarshaller(RECEIVER_BY_BINDING);
};

Unmarshaller.prototype.unmarshall = function(payload, headers) {
  return this.unmarshaller.unmarshall(payload, headers);
};

module.exports = Unmarshaller;
