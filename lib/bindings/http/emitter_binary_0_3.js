const BinaryHTTPEmitter = require("./emitter_binary.js");

const Constants = require("./constants.js");

const headerByGetter = {};

headerByGetter["getDataContentType"] = {
  name : Constants.HEADER_CONTENT_TYPE,
  parser : (v) => v
};

headerByGetter["getDataContentEncoding"] = {
  name : Constants.BINARY_HEADERS_03.CONTENT_ENCONDING,
  parser : (v) => v
};

headerByGetter["getSubject"] = {
  name : Constants.BINARY_HEADERS_03.SUBJECT,
  parser : (v) => v
};

headerByGetter["getType"] = {
  name : Constants.BINARY_HEADERS_03.TYPE,
  parser : (v) => v
};

headerByGetter["getSpecversion"] = {
  name : Constants.BINARY_HEADERS_03.SPEC_VERSION,
  parser : (v) => v
};

headerByGetter["getSource"] = {
  name : Constants.BINARY_HEADERS_03.SOURCE,
  parser : (v) => v
};

headerByGetter["getId"] = {
  name : Constants.BINARY_HEADERS_03.ID,
  parser : (v) => v
};

headerByGetter["getTime"] = {
  name : Constants.BINARY_HEADERS_03.TIME,
  parser : (v) => v
};

headerByGetter["getSchemaurl"] = {
  name : Constants.BINARY_HEADERS_03.SCHEMA_URL,
  parser : (v) => v
};

function HTTPBinary(configuration){
  this.emitter = new BinaryHTTPEmitter(
    configuration,
    headerByGetter,
    Constants.BINARY_HEADERS_03.EXTENSIONS_PREFIX
  );
}

HTTPBinary.prototype.emit = function(cloudevent){
  return this.emitter.emit(cloudevent);
};

module.exports = HTTPBinary;
