import { Parser } from "./parser";

export class Base64Parser implements Parser {
  decorator?: Parser;

  constructor(decorator?: Parser) {
    this.decorator = decorator;
  }

  parse(payload: Record<string, unknown> | string): string {
    let payloadToParse = payload;
    if (this.decorator) {
      payloadToParse = this.decorator.parse(payload) as string;
    }

    return Buffer.from(payloadToParse as string, "base64").toString();
  }
}
