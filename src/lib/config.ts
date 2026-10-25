// Reads and validates server environment variables once. A malformed value
// fails loudly with the variable's name instead of deep inside a request.
// Optional services (Supabase, Resend, Sentry) may be left empty; /api/health
// then reports them as "not_configured".
import "server-only";
import { z } from "zod";

// An empty line in .env (e.g. "RESEND_API_KEY=") should mean "not set".
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (see .env.example)"),
  SUPABASE_URL: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  SENTRY_DSN: optionalString,
});

export type ServerConfig = z.infer<typeof serverEnvSchema>;

let cached: ServerConfig | undefined;

/** Parsed lazily so `next build` does not need production secrets. */
export function serverConfig(): ServerConfig {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n  ${problems.join("\n  ")}`);
  }
  cached = parsed.data;
  return cached;
}

/** Supabase settings, or a clear error naming what is missing. */
export function supabaseConfig() {
  const config = serverConfig();
  const url = config.SUPABASE_URL ?? config.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = config.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env",
    );
  }
  return { url, anonKey, serviceRoleKey };
}
