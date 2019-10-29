import * as v1js from './index.js'

/**
 * CloudEvent class definition
 */
export interface Cloudevent {
  format?: any;
  toString?: string;

  id?: (_id: string) => void;
  getId?: string;

  type?: (_type: string) => void;
  getType?: string;
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
