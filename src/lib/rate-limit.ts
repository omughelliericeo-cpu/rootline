// A simple in-memory limit on how often one visitor can do something (e.g.
// share a photo). Kept in memory only, never stored: on a restart, or on
// another server instance, the counts start again. Good enough to slow a
// script down; the hard limits live in the database.

type Window = { count: number; resetsAt: number };

export type RateLimiter = {
  /** Records one attempt; false when `key` has used up its attempts for now. */
  allow: (key: string, now?: number) => boolean;
};

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const windows = new Map<string, Window>();

  return {
    allow(key, now = Date.now()) {
      const current = windows.get(key);
      if (!current || current.resetsAt <= now) {
        if (windows.size >= maxKeys) prune(windows, now, maxKeys);
        windows.set(key, { count: 1, resetsAt: now + windowMs });
        return true;
      }
      if (current.count >= limit) return false;
      current.count += 1;
      return true;
    },
  };
}

/** Drops finished windows; if all are still running, drops the oldest half so memory stays bounded. */
function prune(windows: Map<string, Window>, now: number, maxKeys: number) {
  for (const [key, window] of windows) if (window.resetsAt <= now) windows.delete(key);
  if (windows.size < maxKeys) return;
  let toDrop = Math.ceil(windows.size / 2);
  for (const key of windows.keys()) {
    if (toDrop-- <= 0) break;
    windows.delete(key);
  }
}
