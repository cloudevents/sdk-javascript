export abstract class Parser {
  abstract parse(payload: Record<string, unknown> | string): unknown;
}
