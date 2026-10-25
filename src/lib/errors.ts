// Central list of error codes. Every error that reaches a user or a log line
// carries one of these codes, so problems can be searched for by name.

export const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Some of the details entered are not valid.",
  UNAUTHENTICATED: "Please log in to continue.",
  FORBIDDEN: "You do not have access to this.",
  NOT_FOUND: "We could not find what you were looking for.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again.",
  // auth
  AUTH_INVALID_CREDENTIALS: "That email and password do not match an account.",
  AUTH_EMAIL_NOT_CONFIRMED: "Please confirm your email first. Check your inbox for the link we sent.",
  AUTH_EMAIL_TAKEN: "An account with this email already exists. Try logging in instead.",
  AUTH_RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  AUTH_CONFIRM_FAILED: "That confirmation link is invalid or has expired.",
  // brand
  BRAND_NOT_FOUND: "No brand is set up for this account.",
  BRAND_PHOTO_LIMIT: "You have reached the maximum number of photos. Remove one to add another.",
  PERSON_NOT_FOUND: "That person is no longer on your brand profile.",
  // suppliers, products, certificates
  SUPPLIER_NOT_FOUND: "That supplier is no longer in your list.",
  PRODUCT_NOT_FOUND: "That product is no longer in your list.",
  CERT_NOT_FOUND: "That certificate is no longer on file.",
  CERT_EXPIRED: "That certificate has already expired. Upload a current one.",
  CERT_CLAIM_NOT_ALLOWED: "That claim cannot be shown as a badge for your industry.",
  IN_USE: "This is still in use, so it cannot be deleted yet.",
  // batches and QR codes
  BATCH_NOT_FOUND: "That batch is no longer in your list.",
  BATCH_PUBLISHED: "Published batches cannot be deleted, because their QR codes may already be on shelves. Mark it sold out or take it offline instead.",
  BATCH_STATUS_INVALID: "That status change is not possible from the batch's current status.",
  BATCH_NOT_READY: "This batch is not ready to publish yet.",
  SHELF_CODE_NOT_FOUND: "That shelf code is no longer in your list.",
  // address lookup
  GEOCODE_NOT_FOUND: "We could not find that address on the map. Add the town and province, or paste the map position.",
  GEOCODE_UNAVAILABLE: "The map search is not answering right now. Paste the map position instead, or try again in a minute.",
  // file uploads
  UPLOAD_INVALID: "That file cannot be used. Upload a JPG, PNG or WebP image under 4 MB.",
  UPLOAD_FAILED: "The file could not be uploaded. Please try again.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * An expected, user-facing failure (bad input, missing record, no access).
 * Throw it from server code; the action wrapper turns it into a typed result.
 * Anything that is not an AppError is treated as an unexpected bug.
 */
export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message?: string, options?: { cause?: unknown }) {
    super(message ?? ERROR_MESSAGES[code], options);
    this.name = "AppError";
    this.code = code;
  }
}

/**
 * Input that passed the basic schema but failed a later check that depends
 * on data (e.g. the brand's industry template). Carries per-field messages.
 */
export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>, message?: string) {
    super("VALIDATION_FAILED", message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
