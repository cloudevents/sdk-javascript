var Spec02 = require("../../specs/spec_0_2.js");

const spec02 = new Spec02();

function JSONParser(_spec) {
  this.spec = (_spec) ? _spec : new Spec02();
}

/**
 * Level 0 of validation: is that string? is that JSON?
 */
function validate_and_parse_as_json(payload) {
  var json = payload;

  if(payload) {
    if( (typeof payload) == "string"){
      try {
        json = JSON.parse(payload);

      }catch(e) {
        throw {message: "invalid json payload", errors: e};
      }

    } else if( (typeof payload) != "object"){
      // anything else
      throw {message: "invalid payload type, allowed are: string or object"};
    }
  } else {
    throw {message: "null or undefined payload"};
  }

  return json;
}

/*
 * Level 1 of validation: is that follow a spec?
 */
function validate_spec(payload, spec) {

  // is that follow the spec?
  spec.check(payload);

  return payload;
}

JSONParser.prototype.parse = function(payload) {

  // Level 0 of validation: is that string? is that JSON?
  var valid0 = validate_and_parse_as_json(payload);

  // Level 1 of validation: is that follow a spec?
  var valid1 = validate_spec(valid0, this.spec);

  return valid1;
}

module.exports = JSONParser;
