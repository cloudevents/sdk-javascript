class Base64Parser {
  constructor(decorator) {
    this.decorator = decorator;
  }

  parse(payload) {
    let payloadToParse = payload;
    if (this.decorator) {
      payloadToParse = this.decorator.parse(payload);
    }

    return Buffer.from(payloadToParse, "base64").toString();
  }
}

module.exports = Base64Parser;
