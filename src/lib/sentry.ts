// Sends unexpected errors to Sentry, tagged with feature, action and requestId
// so a Sentry issue can be matched to the JSON log lines for the same request.
// Does nothing when no DSN is configured (Sentry.init is skipped).
import * as Sentry from "@sentry/nextjs";

export type ErrorTags = {
  feature: string;
  action: string;
  requestId: string;
  brandId?: string;
};

export function reportError(error: unknown, tags: ErrorTags): void {
  Sentry.withScope((scope) => {
    scope.setTag("feature", tags.feature);
    scope.setTag("action", tags.action);
    scope.setTag("requestId", tags.requestId);
    if (tags.brandId) scope.setTag("brandId", tags.brandId);
    Sentry.captureException(error);
  });
}
