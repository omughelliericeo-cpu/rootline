// The single logger. Writes one JSON object per line so logs can be searched
// by requestId, feature, action or brandId (in Vercel, or locally with grep).
// Kept dependency-free so it also runs in the proxy (edge) runtime.

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  feature: string;
  action: string;
  requestId?: string;
  brandId?: string;
  durationMs?: number;
  error?: unknown;
  [key: string]: unknown;
};

const LEVEL_ORDER: Record<LogLevel | "silent", number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

function minimumLevel(): number {
  const configured = (process.env.LOG_LEVEL ?? "info") as LogLevel | "silent";
  return LEVEL_ORDER[configured] ?? LEVEL_ORDER.info;
}

/** Turns an Error into plain fields; JSON.stringify would otherwise drop them. */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return {
      name: error.name,
      message: error.message,
      ...(code !== undefined ? { code } : {}),
      stack: error.stack,
    };
  }
  return { message: String(error) };
}

function write(level: LogLevel, message: string, context: LogContext): void {
  if (LEVEL_ORDER[level] < minimumLevel()) return;
  const { error, ...rest } = context;
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...rest,
    ...(error !== undefined ? { error: serializeError(error) } : {}),
  });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context: LogContext) => write("debug", message, context),
  info: (message: string, context: LogContext) => write("info", message, context),
  warn: (message: string, context: LogContext) => write("warn", message, context),
  error: (message: string, context: LogContext) => write("error", message, context),
};
