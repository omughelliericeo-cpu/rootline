"use client";
// Last-resort error boundary, used when the root layout itself fails.
// It must render its own <html> and <body>.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorPanel } from "@/ui/ErrorPanel";
import "./globals.css";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <html lang="en">
      <body>
        <ErrorPanel digest={digest} onRetry={retry} />
      </body>
    </html>
  );
}
