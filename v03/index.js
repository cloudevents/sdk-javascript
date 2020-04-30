const CloudEvent = require("../lib/cloudevent.js");
const Spec = require("../lib/specs/spec_0_3.js");
const StructuredHTTPEmitter =
  require("../lib/bindings/http/emitter_structured.js");
const BinaryHTTPEmitter = require("../lib/bindings/http/emitter_binary_0_3.js");

const StructuredHTTPReceiver =
  require("../lib/bindings/http/receiver_structured_0_3.js");

const BinaryHTTPReceiver =
  require("../lib/bindings/http/receiver_binary_0_3.js");

const HTTPUnmarshaller = require("../lib/bindings/http/unmarshaller_0_3.js");

function newEvent() {
  return new CloudEvent(Spec);
}

module.exports = {
  Spec,
  StructuredHTTPEmitter,
  StructuredHTTPReceiver,
  BinaryHTTPEmitter,
  BinaryHTTPReceiver,
  HTTPUnmarshaller,
  CloudEvent: newEvent,
  event: newEvent
};
