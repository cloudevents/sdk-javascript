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
  (caller: any): any;
}
