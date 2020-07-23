import { Parser } from "./parser";

export class PassThroughParser extends Parser {
  parse(payload: unknown): unknown {
    return payload;
  }
}
