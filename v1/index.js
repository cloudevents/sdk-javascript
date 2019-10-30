const Cloudevent = require("../lib/cloudevent.js");
const Spec = require("../lib/specs/spec_1.js");
const StructuredHTTPEmitter =
  require("../lib/bindings/http/emitter_structured.js");
const BinaryHTTPEmitter = require("../lib/bindings/http/emitter_binary_1.js");

function event() {
  return new Cloudevent(Spec);
}

module.exports = {
  Spec,
  StructuredHTTPEmitter,
  BinaryHTTPEmitter,
  event
};
