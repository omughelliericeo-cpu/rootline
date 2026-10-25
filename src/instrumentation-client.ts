// Sentry setup for the browser. Each browser error is tagged with the
// requestId of the latest server request (from the rl_rid cookie), so it can
// be matched to server logs. Disabled when NEXT_PUBLIC_SENTRY_DSN is empty.
import * as Sentry from "@sentry/nextjs";
import { readRequestIdFromCookie } from "@/lib/request-id";
import { sentryBaseOptions } from "@/lib/sentry-options";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    ...sentryBaseOptions,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    beforeSend(event) {
      const requestId = readRequestIdFromCookie(document.cookie);
      if (requestId) event.tags = { ...event.tags, requestId };
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
