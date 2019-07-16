function sanityAndClone(headers) {

  var sanityHeaders = {};

  for(header in headers){
    sanityHeaders[header.toLowerCase()] = headers[header];
  }

  return sanityHeaders;
}

module.exports = {
  sanity_and_clone : sanityAndClone
};
