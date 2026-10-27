// Tests for the in-memory rate limiter.
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../rate-limit";

describe("createRateLimiter", () => {
  it("allows `limit` attempts per window, then refuses until it resets", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("a", 10)).toBe(true);
    expect(limiter.allow("a", 20)).toBe(false);
    expect(limiter.allow("b", 20)).toBe(true);
    expect(limiter.allow("a", 1000)).toBe(true);
  });

  it("keeps memory bounded when many visitors arrive at once", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 4 });
    for (let i = 0; i < 20; i += 1) expect(limiter.allow(`visitor-${i}`, 0)).toBe(true);
    // The newest visitor is still being counted.
    expect(limiter.allow("visitor-19", 1)).toBe(false);
  });
});
