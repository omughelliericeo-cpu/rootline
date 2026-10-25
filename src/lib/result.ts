// The one return shape for every server action and API handler:
// { ok: true, data } or { ok: false, error: { code, message, requestId } }.

import { ERROR_MESSAGES, type ErrorCode } from "./errors";

export type ActionError = {
  code: ErrorCode;
  message: string;
  /** Quote this when reporting a problem; it appears in every related log line. */
  requestId: string;
  /** Per-field messages for forms, keyed by field name. */
  fieldErrors?: Record<string, string[]>;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  requestId: string,
  message: string = ERROR_MESSAGES[code],
  fieldErrors?: Record<string, string[]>,
): { ok: false; error: ActionError } {
  return { ok: false, error: { code, message, requestId, ...(fieldErrors ? { fieldErrors } : {}) } };
}

/** The first error message for one form field, if the last submit failed on it. */
export function fieldError(result: Result<unknown> | null | undefined, field: string): string | undefined {
  return result && !result.ok ? result.error.fieldErrors?.[field]?.[0] : undefined;
}
