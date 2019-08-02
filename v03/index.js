const Cloudevent = require("../lib/cloudevent.js");
const Spec = require("../lib/specs/spec_0_3.js");
const StructuredHTTPEmitter = require("../lib/bindings/http/emitter_binary.js");
const BinaryHTTPEmitter = require("../lib/bindings/http/emitter_binary_0_3.js");

function event() {
  return new Cloudevent(Spec);
}

module.exports = {
  Spec,
  StructuredHTTPEmitter,
  BinaryHTTPEmitter,
  event
};
