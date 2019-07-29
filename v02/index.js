const Cloudevent = require("../lib/cloudevent.js");
const Spec = require("../lib/specs/spec_0_2.js");
const StructuredHTTPEmitter =
  require("../lib/bindings/http/emitter_structured_0_2.js");
const {HTTPBinary02} = require("../lib/bindings/http/emitter_binary_0_2.js");

function event() {
  return new Cloudevent(Spec);
}

module.exports = {
  Spec,
  StructuredHTTPEmitter,
  BinaryHTTPEmitter : HTTPBinary02,
  event
};
