// One small function per external service used by GET /api/health.
// Each returns a CheckResult and never throws.
import "server-only";
import { serverConfig } from "../config";
import { db } from "../db";
import { withTimeout, type CheckResult } from "./summary";

const TIMEOUT_MS = 3000;

async function timed(run: () => Promise<void>): Promise<CheckResult> {
  const started = performance.now();
  try {
    await withTimeout(run(), TIMEOUT_MS);
    return { status: "ok", latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      status: "error",
      latencyMs: Math.round(performance.now() - started),
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function expectOkResponse(url: string, headers: Record<string, string>): Promise<void> {
  const response = await fetch(url, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
}

export function checkDatabase(): Promise<CheckResult> {
  return timed(async () => {
    await db().$queryRaw`SELECT 1`;
  });
}

export async function checkStorage(): Promise<CheckResult> {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = serverConfig();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { status: "not_configured" };
  return timed(() =>
    expectOkResponse(`${SUPABASE_URL}/storage/v1/bucket`, {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    }),
  );
}

export async function checkEmail(): Promise<CheckResult> {
  const { RESEND_API_KEY, EMAIL_PROVIDER } = serverConfig();
  if (EMAIL_PROVIDER === "log") return { status: "ok", message: "Log-only mode: emails are written to the logs, not sent" };
  if (!RESEND_API_KEY) return { status: "not_configured" };
  // Listing domains is a cheap authenticated call that proves the key works.
  return timed(() =>
    expectOkResponse("https://api.resend.com/domains", { Authorization: `Bearer ${RESEND_API_KEY}` }),
  );
}

export async function checkPayments(): Promise<CheckResult> {
  const { STRIPE_SECRET_KEY } = serverConfig();
  if (!STRIPE_SECRET_KEY) return { status: "not_configured" };
  // Reading the account balance is a cheap authenticated call that proves the key works.
  return timed(() => expectOkResponse("https://api.stripe.com/v1/balance", { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }));
}
