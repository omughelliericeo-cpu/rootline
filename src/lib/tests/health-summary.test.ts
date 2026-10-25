// Tests for the rules that combine service checks into one health status.
import { describe, expect, it } from "vitest";
import { overallStatus, withTimeout } from "../health/summary";

describe("overallStatus", () => {
  it("is ok when every check is ok", () => {
    expect(overallStatus({ database: { status: "ok" }, email: { status: "ok" } })).toBe("ok");
  });

  it("is down when the database fails, whatever else happens", () => {
    expect(overallStatus({ database: { status: "error" }, email: { status: "ok" } })).toBe("down");
  });

  it("is degraded when another service fails or is not configured", () => {
    expect(overallStatus({ database: { status: "ok" }, email: { status: "not_configured" } })).toBe("degraded");
    expect(overallStatus({ database: { status: "ok" }, storage: { status: "error" } })).toBe("degraded");
  });
});

describe("withTimeout", () => {
  it("resolves when the promise is fast enough", async () => {
    await expect(withTimeout(Promise.resolve(42), 50)).resolves.toBe(42);
  });

  it("rejects when the promise is too slow", async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 100));
    await expect(withTimeout(slow, 10)).rejects.toThrow("Timed out after 10ms");
  });
});
