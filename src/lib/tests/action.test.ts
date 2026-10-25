// Tests for the server action wrapper: validation, typed results, and that
// unexpected errors are hidden from the client but reported.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("../request-context", () => ({ getRequestId: async () => "req_0123456789ab" }));
vi.mock("../sentry", () => ({ reportError: vi.fn() }));

import { defineAction } from "../action";
import { AppError } from "../errors";
import { reportError } from "../sentry";

const greet = defineAction({
  feature: "test",
  action: "greet",
  input: z.object({ name: z.string().min(2, "Name is too short") }),
  handler: async ({ name }) => {
    if (name === "missing") throw new AppError("NOT_FOUND");
    if (name === "crash") throw new Error("database password is hunter2");
    return `Hello ${name}`;
  },
});

describe("defineAction", () => {
  beforeEach(() => vi.mocked(reportError).mockClear());

  it("returns ok with the handler's data", async () => {
    expect(await greet({ name: "Ada" })).toEqual({ ok: true, data: "Hello Ada" });
  });

  it("returns VALIDATION_FAILED with field errors for bad input", async () => {
    const result = await greet({ name: "A" });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_FAILED", requestId: "req_0123456789ab", fieldErrors: { name: ["Name is too short"] } },
    });
  });

  it("passes expected AppErrors through with their code", async () => {
    const result = await greet({ name: "missing" });
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(reportError).not.toHaveBeenCalled();
  });

  it("hides unexpected errors from the client and reports them", async () => {
    const result = await greet({ name: "crash" });
    expect(result).toMatchObject({ ok: false, error: { code: "INTERNAL_ERROR", requestId: "req_0123456789ab" } });
    expect(JSON.stringify(result)).not.toContain("hunter2");
    expect(reportError).toHaveBeenCalledOnce();
  });
});
