function sanityAndClone(headers) {

  var sanityHeaders = {};

  Array.from(Object.keys(headers))
    .filter((header) => Object.hasOwnProperty.call(headers, header))
    .forEach((header) => {
      sanityHeaders[header.toLowerCase()] = headers[header];
    });

  return sanityHeaders;
}

module.exports = {
  sanityAndClone
};
