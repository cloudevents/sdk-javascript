function sanity_and_clone(headers) {
  var sanity_headers = JSON.parse(JSON.stringify(headers));

  for(header in sanity_headers){
    sanity_headers[header.toLowerCase()] = sanity_headers[header];
  }

  return sanity_headers;
}

module.exports = {
  sanity_and_clone : sanity_and_clone
};
