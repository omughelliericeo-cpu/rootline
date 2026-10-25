// Next.js server start-up hook. Loads Sentry for the current runtime, and
// logs every error Next.js catches while rendering, with its requestId and
// digest. The digest is the "reference" a user sees on an error screen in
// production, so searching the logs for it finds the full error.
import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { logger } from "@/lib/logger";
import { REQUEST_ID_HEADER } from "@/lib/request-id";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("../sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("../sentry.edge.config");
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const header = request.headers[REQUEST_ID_HEADER];
  const requestId = Array.isArray(header) ? header[0] : header;
  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;

  logger.error("request crashed", {
    feature: "next",
    action: context.routeType,
    requestId,
    digest,
    path: request.path,
    route: context.routePath,
    error,
  });

  Sentry.withScope((scope) => {
    if (requestId) scope.setTag("requestId", requestId);
    scope.setTag("feature", "next");
    Sentry.captureRequestError(error, request, context);
  });
};
