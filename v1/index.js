const Cloudevent = require("../lib/cloudevent.js");
const Spec = require("../lib/specs/spec_1.js");

function event() {
  return new Cloudevent(Spec);
}

module.exports = {
  Spec,
  event
};
