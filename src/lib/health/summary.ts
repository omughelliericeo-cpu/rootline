// Pure rules for turning individual service checks into one health status.
// Kept separate from the checks themselves so they can be unit tested.

export type CheckStatus = "ok" | "error" | "not_configured";

export type CheckResult = {
  status: CheckStatus;
  latencyMs?: number;
  message?: string;
};

export type OverallStatus = "ok" | "degraded" | "down";

/**
 * The database is the only service the app cannot work without, so it alone
 * decides "down". Any other failing or unconfigured service means "degraded".
 */
export function overallStatus(checks: Record<string, CheckResult>): OverallStatus {
  if (checks.database?.status !== "ok") return "down";
  const allOk = Object.values(checks).every((check) => check.status === "ok");
  return allOk ? "ok" : "degraded";
}

/** Rejects if the promise takes longer than `ms`, so one slow service cannot hang the health check. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
