const BinaryHTTPEmitter = require("./emitter_binary.js");

const Constants = require("./constants.js");

const headerByGetter = {};

headerByGetter["getContenttype"] = {
  name : Constants.HEADER_CONTENT_TYPE,
  parser : (v) => v
};

headerByGetter["getType"] = {
  name : Constants.BINARY_HEADERS_02.TYPE,
  parser : (v) => v
};

headerByGetter["getSpecversion"] = {
  name : Constants.BINARY_HEADERS_02.SPEC_VERSION,
  parser : (v) => v
};

headerByGetter["getSource"] = {
  name : Constants.BINARY_HEADERS_02.SOURCE,
  parser : (v) => v
};

headerByGetter["getId"] = {
  name : Constants.BINARY_HEADERS_02.ID,
  parser : (v) => v
};

headerByGetter["getTime"] = {
  name : Constants.BINARY_HEADERS_02.TIME,
  parser : (v) => v
};

headerByGetter["getSchemaurl"] = {
  name : Constants.BINARY_HEADERS_02.SCHEMA_URL,
  parser : (v) => v
};

function HTTPBinary02(configuration){
  this.emitter = new BinaryHTTPEmitter(
    configuration,
    headerByGetter,
    Constants.BINARY_HEADERS_02.EXTENSIONS_PREFIX
  );
}

HTTPBinary02.prototype.emit = function(cloudevent){
  return this.emitter.emit(cloudevent);
};

module.exports = {
  HTTPBinary02
};
