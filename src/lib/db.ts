// The one Prisma client for the app. Only feature `server/` folders (and
// src/lib) may import this file; ESLint enforces that rule.
//
// The app connects as the restricted "rootline_app" role, so row-level
// security applies: a query returns nothing unless it runs inside
// withTenant(), which tells Postgres who is asking.
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { serverConfig } from "./config";

function createClient() {
  const adapter = new PrismaPg({ connectionString: serverConfig().DATABASE_URL });
  return new PrismaClient({ adapter });
}

// In development, Next.js reloads modules on every edit; keeping the client on
// globalThis stops each reload from opening a new pool of connections.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export function db() {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/** A database handle that is only valid inside withTenant(). */
export type Tx = Prisma.TransactionClient;

export type Tenant = {
  /** The logged-in Supabase user. Lets them see their own brand row. */
  userId: string;
  /** Their brand. Lets them see rows that belong to the brand. */
  brandId?: string;
};

/**
 * Runs `work` in one transaction with the RLS settings for this tenant.
 * `set_config(..., true)` scopes the settings to this transaction only, so a
 * pooled connection can never leak one brand's identity to the next request.
 */
export function withTenant<T>(tenant: Tenant, work: (tx: Tx) => Promise<T>): Promise<T> {
  return db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.user_id', ${tenant.userId}, true),
                              set_config('app.brand_id', ${tenant.brandId ?? ""}, true)`;
    return work(tx);
  });
}

/**
 * True when a delete failed because other rows still point at this one
 * (e.g. a product that has certificates or batches).
 * Two shapes: Prisma's P2003 when the check runs straight away, and the
 * driver adapter's "ForeignKeyConstraintViolation" when a deferred check
 * fails as the transaction commits (see the defer_in_use_checks migration).
 */
export function isStillReferenced(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, message, cause } = error as { code?: unknown; message?: unknown; cause?: { kind?: unknown } };
  return code === "P2003" || message === "ForeignKeyConstraintViolation" || cause?.kind === "ForeignKeyConstraintViolation";
}

/**
 * For public story pages (no login): runs `work` with app.public = 'on'.
 * Row-level security then allows reading only published batches and what
 * their story page shows, and adding scan events. See the
 * story_page_public_access migration.
 */
export function withPublic<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
  return db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.public', 'on', true),
                              set_config('app.user_id', '', true),
                              set_config('app.brand_id', '', true)`;
    return work(tx);
  });
}
