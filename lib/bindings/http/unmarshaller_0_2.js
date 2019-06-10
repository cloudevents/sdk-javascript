
const content_type_header = "content-type";
const ce_structured_content_type = "application/cloudevents";

const allowed_binary_content_types = [];
allowed_binary_content_types.push("application/json");

const allowed_structured_content_types = [];
allowed_structured_content_types.push("application/cloudevents+json");

function validate_args(payload, headers) {
  if(!payload){
    throw {message: "payload is null or undefined"};
  }

  if(!headers){
    throw {message: "headers is null or undefined"};
  }

  if(!headers[content_type_header]){
    throw {message: "content-type header not found"};
  }
}

// Is it binary or structured?
function resolve_binding_type(payload, headers) {

  var contentType = headers[content_type_header];
  if(contentType.startsWith(ce_structured_content_type)){
    // Structured
    if(allowed_structured_content_types.includes(contentType)){

    } else {
      throw {message: "structured+type not allowed", errors: [contentType]};
    }
  } else {
    // Binary
    if(allowed_binary_content_types.includes(contentType)){

    } else {
      throw {message: "content type not allowed", errors : [contentType]};
    }
  }
}

var Unmarshaller = function() {

}

Unmarshaller.prototype.unmarshall = function(payload, headers) {
  validate_args(payload, headers);

  // Resolve the binding
  var binding = resolve_binding_type(payload, headers);

}

module.exports = Unmarshaller;
