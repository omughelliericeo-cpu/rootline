// Tests that the logger writes one JSON line with the expected fields.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger, serializeError } from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.stubEnv("LOG_LEVEL", "debug");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("writes structured JSON with feature, action and requestId", () => {
    const write = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("action started", { feature: "batches", action: "create", requestId: "req_0123456789ab" });

    const line = JSON.parse(write.mock.calls[0]![0] as string);
    expect(line).toMatchObject({
      level: "info",
      message: "action started",
      feature: "batches",
      action: "create",
      requestId: "req_0123456789ab",
    });
    expect(typeof line.timestamp).toBe("string");
  });

  it("sends warnings and errors to stderr with the error serialised", () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("action crashed", { feature: "batches", action: "create", error: new Error("boom") });

    const line = JSON.parse(write.mock.calls[0]![0] as string);
    expect(line.error.message).toBe("boom");
  });

  it("skips lines below LOG_LEVEL", () => {
    vi.stubEnv("LOG_LEVEL", "warn");
    const write = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("quiet", { feature: "x", action: "y" });
    expect(write).not.toHaveBeenCalled();
  });

  it("serialises non-Error values", () => {
    expect(serializeError("plain")).toEqual({ message: "plain" });
  });
});
