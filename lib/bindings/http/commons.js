function sanity_and_clone(headers) {
  //var sanity_headers = JSON.parse(JSON.stringify(headers));
  var sanity_headers = {};

  for(header in headers){
    sanity_headers[header.toLowerCase()] = headers[header];
  }

  return sanity_headers;
}

module.exports = {
  sanity_and_clone : sanity_and_clone
};
