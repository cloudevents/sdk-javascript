
function JSONFormatter(){

}

/*
 * Every internal data structure are JSON by nature, them
 * no transformation is required
 */
JSONFormatter.prototype.format = function(payload){
  return payload;
};

JSONFormatter.prototype.toString = function(payload){
  return JSON.stringify(payload);
};

module.exports = JSONFormatter;
