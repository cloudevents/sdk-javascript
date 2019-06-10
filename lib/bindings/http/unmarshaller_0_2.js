
const content_type_header = "content-type";
const ce_structured_content_type = "application/cloudevents";

/**
 * Level 0 of validation: is that string? is that JSON?
 */
function validate_and_parse_as_json(payload) {
  var json = payload;

  if( (typeof payload) === "string"){
    try {
      json = JSON.parse(payload);

    }catch(e) {
      throw {message: "Invalid payload", errors: e};
    }

  } else if( (typeof payload) !== "object"){
    // anything else
    throw {message: "Invalid payload type, allowed are: string or object"};
  }

  return json;
}

var Unmarshaller = function() {

}

Unmarshaller.prototype.unmarshall = function(payload, headers) {

  var valid0 = validate_and_parse_as_json(payload);

  //TODO binary or structured ?
  //"Content-Type"

}

module.exports = Unmarshaller;
