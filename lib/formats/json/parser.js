function JSONParser() {

}

/**
 * Level 0 of validation: is that string? is that JSON?
 */
function validateAndParse(payload) {
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
function validateSpec(payload, spec) {

  // is that follow the spec?
  spec.check(payload);

  return payload;
}

JSONParser.prototype.parse = function(payload) {

  //is that string? is that JSON?
  var valid = validateAndParse(payload);

  return valid;
}

module.exports = JSONParser;
