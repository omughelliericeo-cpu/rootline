"use client";
// Error boundary for public story pages: a calm message for shoppers, with
// the reference a producer can quote when reporting it.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorPanel } from "@/ui/ErrorPanel";

export default function StoryError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <ErrorPanel
      title="This story could not be loaded"
      message="Please try again in a moment. If it keeps happening, let the shop or maker know."
      digest={digest}
      onRetry={retry}
    />
  );
}
