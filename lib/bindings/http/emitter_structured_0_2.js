const StructuredHTTPEmitter = require("./emitter_structured.js");

function HTTPStructured(configuration){
  this.emitter = new StructuredHTTPEmitter(configuration);
}

HTTPStructured.prototype.emit = function(cloudevent){
  return this.emitter.emit(cloudevent);
};

module.exports = HTTPStructured;
