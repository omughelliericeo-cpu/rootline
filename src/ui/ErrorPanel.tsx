"use client";
// Friendly error message shown by every error boundary. It shows the
// requestId (from the rl_rid cookie) and, for server errors, the digest, so a
// user can quote a reference that finds the problem in the logs.
import { useSyncExternalStore } from "react";
import { readRequestIdFromCookie } from "@/lib/request-id";
import { Button } from "./Button";
import { Card } from "./Card";

type ErrorPanelProps = {
  title?: string;
  message?: string;
  digest?: string;
  onRetry?: () => void;
};

const subscribe = () => () => {};

export function ErrorPanel({
  title = "Something went wrong",
  message = "Sorry, this page could not be loaded. Please try again in a moment.",
  digest,
  onRetry,
}: ErrorPanelProps) {
  // Cookies only exist in the browser; on the server this renders nothing.
  const requestId = useSyncExternalStore(
    subscribe,
    () => readRequestIdFromCookie(document.cookie),
    () => undefined,
  );

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <Card>
        <h1 className="mb-3 text-2xl">{title}</h1>
        <p className="mb-6 text-muted">{message}</p>
        {(requestId || digest) && (
          <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {requestId && (
              <>
                <dt className="text-muted">Reference</dt>
                <dd className="font-mono">{requestId}</dd>
              </>
            )}
            {digest && (
              <>
                <dt className="text-muted">Error code</dt>
                <dd className="font-mono">{digest}</dd>
              </>
            )}
          </dl>
        )}
        {onRetry && <Button onClick={onRetry}>Try again</Button>}
      </Card>
    </main>
  );
}
