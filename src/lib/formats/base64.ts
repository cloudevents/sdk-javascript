class Base64Parser {
  decorator: any;

  constructor(decorator: any) {
    this.decorator = decorator;
  }

  parse(payload: any): any {
    let payloadToParse = payload;
    if (this.decorator) {
      payloadToParse = this.decorator.parse(payload);
    }

    return Buffer.from(payloadToParse, "base64").toString();
  }
}

module.exports = Base64Parser;
