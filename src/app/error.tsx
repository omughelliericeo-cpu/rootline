"use client";
// Error boundary for every page under the root layout. Shows a friendly
// message with a reference the user can quote (see ErrorPanel).
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorPanel } from "@/ui/ErrorPanel";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return <ErrorPanel digest={digest} onRetry={retry} />;
}
