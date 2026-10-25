"use client";
// Error boundary for sign-up and login pages.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorPanel } from "@/ui/ErrorPanel";

export default function AuthError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return <ErrorPanel message="We could not load this page. Please try again in a moment." digest={digest} onRetry={retry} />;
}
