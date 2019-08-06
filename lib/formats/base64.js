
function Parser(decorator) {
  this.decorator = decorator;
}

Parser.prototype.parse = function(payload) {
  let toparse = payload;
  if(this.decorator){
    toparse = this.decorator.parse(payload);
  }

  return Buffer.from(toparse, "base64").toString();
};

module.exports = Parser;
