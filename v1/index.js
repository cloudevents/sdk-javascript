const Cloudevent = require("../lib/cloudevent.js");
const Spec = require("../lib/specs/spec_1.js");

const StructuredHTTPEmitter =
  require("../lib/bindings/http/emitter_structured.js");

const BinaryHTTPEmitter = require("../lib/bindings/http/emitter_binary_1.js");

const StructuredHTTPReceiver =
  require("../lib/bindings/http/receiver_structured_1.js");

const BinaryHTTPReceiver =
  require("../lib/bindings/http/receiver_binary_1.js");

function event() {
  return new Cloudevent(Spec);
}

module.exports = {
  Spec,
  StructuredHTTPEmitter,
  BinaryHTTPEmitter,
  StructuredHTTPReceiver,
  BinaryHTTPReceiver,
  event
};
