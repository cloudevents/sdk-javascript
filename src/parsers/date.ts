import { Parser } from "./parser";

export class DateParser extends Parser {
  parse(payload: string): Date {
    return new Date(Date.parse(payload));
  }
}
