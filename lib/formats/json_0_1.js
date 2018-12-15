
function JSONFormatter(){

}

JSONFormatter.prototype.format = function(payload){
  return payload;
};

JSONFormatter.prototype.toString = function(payload){
  return JSON.stringify(payload);
};

module.exports = JSONFormatter;
