/**
 * CloudEvent class definition
 */
export class Cloudevent {
  public constructor(spec?: any, formatter?: any);

  public format(): any;
  public toString(): string;

  public id(id: string): Cloudevent;
  public getId(): string;

  public source(source: string): Cloudevent;
  public getSource(): string;

  public getSpecversion(): string;

  public type(type: string): Cloudevent;
  public getType(): string;

  public dataContentType(dct: string): Cloudevent;
  public getDataContentType(): string;

  public dataschema(schema: string): Cloudevent;
  public getDataschema(): string;

  public subject(subject: string): Cloudevent;
  public getSubject(): string;

  public time(time: Date): Cloudevent;
  public getTime(): Date;

  public data(data: any): Cloudevent;
  public getData(): any;

  public addExtension(name: string, value: any): Cloudevent;

  public getExtensions(): Map<string, any>;
}

/**
 * HTTP emitter for Structured mode
 */
export class StructuredHTTPEmitter {
  public constructor(configuration?: any);

  public emit(event: Cloudevent): Promise<any>;
}

/**
 * HTTP emitter for Binary mode
 */
export class BinaryHTTPEmitter {
  public constructor(configuration?: any);

  public emit(event: Cloudevent): Promise<any>;
}

/**
 * HTTP receiver for Structured mode
 */
export class StructuredHTTPReceiver {
  public check(payload: any, headers: any): void;
  public parse(payload: any, headers: any): Cloudevent;
}

/**
 * HTTP receiver for Structured mode
 */
export class BinaryHTTPReceiver {
  public check(payload: any, headers: any): void;
  public parse(payload: any, headers: any): Cloudevent;
}

/**
 * Function to create CloudEvents instances
 */
export declare function event(): Cloudevent;

export default Cloudevent;
