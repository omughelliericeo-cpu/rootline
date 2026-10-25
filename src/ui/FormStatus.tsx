// The line under a form after it is submitted: a success message, or the
// error message with its reference (requestId) so a problem can be reported.
import type { Result } from "@/lib/result";
import { cx } from "./cx";

type FormStatusProps = {
  result: Result<{ message?: string } | unknown> | null | undefined;
  className?: string;
};

export function FormStatus({ result, className }: FormStatusProps) {
  if (!result) return null;

  if (result.ok) {
    const message = (result.data as { message?: string } | undefined)?.message;
    if (!message) return null;
    return (
      <p role="status" className={cx("text-sm text-forest", className)}>
        {message}
      </p>
    );
  }

  return (
    <p role="alert" className={cx("text-sm text-danger", className)}>
      {result.error.message}{" "}
      {result.error.code !== "VALIDATION_FAILED" && (
        <span className="text-muted">(Reference {result.error.requestId})</span>
      )}
    </p>
  );
}
