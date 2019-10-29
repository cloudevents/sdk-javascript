import * as v1js from './index.js'

/**
 * CloudEvent class definition
 */
export class Cloudevent {
  public format(): any;
  public toString(): string;

  public id(id: string): Cloudevent;
  public getId(): string;

  public type(type: string): Cloudevent;
  public getType(): string;
}

/**
 * CloudEvents Spec v1.0 definitions
 */
export interface Spec {
  new (caller: any): Spec;
}

/**
 * Function to create CloudEvents instances
 */
export function event(): Cloudevent {
  return v1js.event();
}

export default Cloudevent;
