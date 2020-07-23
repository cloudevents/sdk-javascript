import { ErrorObject } from "ajv";

/**
 * An Error class that will be thrown when a CloudEvent
 * cannot be properly validated against a specification.
 */
export class ValidationError extends TypeError {
  errors?: string[] | ErrorObject[] | null;

  constructor(message: string, errors?: string[] | ErrorObject[] | null) {
    super(message);
    this.errors = errors ? errors : [];
  }
}
