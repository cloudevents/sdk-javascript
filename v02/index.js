const Cloudevent = require("../lib/cloudevent.js");
const Spec = require("../lib/specs/spec_0_2.js");
const StructuredHTTPEmitter =
  require("../lib/bindings/http/emitter_structured_0_2.js");
const {HTTPBinary02} = require("../lib/bindings/http/emitter_binary_0_2.js");
const StructuredHTTPReceiver =
  require("../lib/bindings/http/receiver_structured_0_2.js");
const BinaryHTTPReceiver =
  require("../lib/bindings/http/receiver_binary_0_2.js");

const HTTPUnmarshaller = require("../lib/bindings/http/unmarshaller_0_2.js");

function event() {
  return new Cloudevent(Spec);
}

module.exports = {
  Spec,
  StructuredHTTPEmitter,
  StructuredHTTPReceiver,
  BinaryHTTPEmitter : HTTPBinary02,
  BinaryHTTPReceiver,
  HTTPUnmarshaller,
  event
};
