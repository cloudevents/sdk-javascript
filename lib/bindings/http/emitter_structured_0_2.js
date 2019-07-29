const StructuredHTTPEmitter = require("./emitter_structured.js");

const Constants = require("./constants.js");

function HTTPStructured(configuration){
  this.emitter = new StructuredHTTPEmitter(configuration);
}

HTTPStructured.prototype.emit = function(cloudevent){
  return this.emitter.emit(cloudevent);
};

module.exports = HTTPStructured;
