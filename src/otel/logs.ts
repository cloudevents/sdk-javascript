/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import { Context, diag } from "@opentelemetry/api";
import { LogRecord, SeverityNumber, logs } from "@opentelemetry/api-logs";

import { ATTR_EXCEPTION_MESSAGE, Operation, SCOPE_NAME } from "./constants";

interface ExceptionEvent {
  eventName: string;
  severityNumber: SeverityNumber;
  severityText: string;
}

// Severity follows the messaging semantic conventions.
const EXCEPTION_EVENTS: Record<Operation, ExceptionEvent> = {
  send: { eventName: "messaging.send.exception", severityNumber: SeverityNumber.WARN, severityText: "WARN" },
  process: { eventName: "messaging.process.exception", severityNumber: SeverityNumber.ERROR, severityText: "ERROR" },
};

export function logException(operation: Operation, exception: unknown, spanContext: Context): void {
  const record: LogRecord = { ...EXCEPTION_EVENTS[operation], ...exceptionFields(exception), context: spanContext };
  try {
    logs.getLogger(SCOPE_NAME).emit(record);
  } catch (error) {
    diag.error("cloudevents: failed to log an exception event", error);
  }
}

// Supply a fallback message for thrown values the logs SDK cannot describe.
function exceptionFields(exception: unknown): Pick<LogRecord, "exception" | "attributes"> {
  if (typeof exception === "string" || typeof exception === "number") {
    return { exception };
  }
  const attributes = { [ATTR_EXCEPTION_MESSAGE]: describeFailure(exception) };
  try {
    if (exception && typeof exception === "object") {
      const { code, name, message, stack } = exception as Record<string, unknown>;
      if (code || name || message) {
        return { exception };
      }
      if (stack) {
        return { exception, attributes };
      }
    }
  } catch {
    // Reading properties of a thrown value must not replace the application's exception
  }
  return { attributes };
}

// instanceof alone does not recognize errors from other realms.
export function isError(value: unknown): value is Error {
  try {
    return value instanceof Error || Object.prototype.toString.call(value) === "[object Error]";
  } catch {
    return false;
  }
}

export function describeFailure(failure: unknown): string {
  try {
    if (isError(failure) && typeof failure.message === "string") {
      return failure.message;
    }
    return String(failure);
  } catch {
    return "Unknown exception";
  }
}
