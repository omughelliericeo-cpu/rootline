// Sentry setup for the Node.js server runtime (pages, actions, API routes).
// Loaded from src/instrumentation.ts. Disabled when SENTRY_DSN is empty.
import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "./src/lib/sentry-options";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    ...sentryBaseOptions,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
