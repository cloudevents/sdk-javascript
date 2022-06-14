/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { ErrorObject } from "ajv";

export type TypeArray = Int8Array | Uint8Array | Int16Array | Uint16Array | 
  Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;


/**
 * An Error class that will be thrown when a CloudEvent
 * cannot be properly validated against a specification.
 */
export class ValidationError extends TypeError {
  errors?: string[] | ErrorObject[] | null;

  constructor(message: string, errors?: string[] | ErrorObject[] | null) {
    const messageString =
      errors instanceof Array
        ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          errors?.reduce(
            (accum: string, err: Record<string, string>) =>
              accum.concat(`
  ${err instanceof Object ? JSON.stringify(err) : err}`),
            message,
          )
        : message;
    super(messageString);
    this.errors = errors ? errors : [];
  }
}

export const isString = (v: unknown): boolean => typeof v === "string";
export const isObject = (v: unknown): boolean => typeof v === "object";
export const isDefined = (v: unknown): boolean => v !== null && typeof v !== "undefined";

export const isBoolean = (v: unknown): boolean => typeof v === "boolean";
export const isInteger = (v: unknown): boolean => Number.isInteger(v as number);
export const isDate = (v: unknown): v is Date => v instanceof Date;
export const isBinary = (v: unknown): boolean => ArrayBuffer.isView(v);

export const isStringOrThrow = (v: unknown, t: Error): boolean =>
  isString(v)
    ? true
    : (() => {
        throw t;
      })();

export const isDefinedOrThrow = (v: unknown, t: Error): boolean =>
  isDefined(v)
    ? true
    : (() => {
        throw t;
      })();

export const isStringOrObjectOrThrow = (v: unknown, t: Error): boolean =>
  isString(v)
    ? true
    : isObject(v)
    ? true
    : (() => {
        throw t;
      })();

export const equalsOrThrow = (v1: unknown, v2: unknown, t: Error): boolean =>
  v1 === v2
    ? true
    : (() => {
        throw t;
      })();

export const isBase64 = (value: unknown): boolean =>
  Buffer.from(value as string, "base64").toString("base64") === value;

export const isBuffer = (value: unknown): boolean => value instanceof Buffer;

export const asBuffer = (value: string | Buffer | TypeArray): Buffer =>
  isBinary(value)
    ? Buffer.from((value as unknown) as string)
    : isBuffer(value)
    ? (value as Buffer)
    : (() => {
        throw new TypeError("is not buffer or a valid binary");
      })();

export const asBase64 = 
(value: string | Buffer | TypeArray): string => asBuffer(value).toString("base64");

export const clone = (o: Record<string, unknown>): Record<string, unknown> => JSON.parse(JSON.stringify(o));

export const isJsonContentType = (contentType: string): "" | RegExpMatchArray | null =>
  contentType && contentType.match(/(json)/i);

export const asData = (data: unknown, contentType: string): string => {
  // pattern matching alike
  const maybeJson =
    isString(data) && !isBase64(data) && isJsonContentType(contentType) ? JSON.parse(data as string) : data;

  return isBinary(maybeJson) ? asBase64(maybeJson) : maybeJson;
};

export const isValidType = (v: boolean | number | string | Date | TypeArray | unknown): boolean =>
  isBoolean(v) || isInteger(v) || isString(v) || isDate(v) || isBinary(v) || isObject(v);
