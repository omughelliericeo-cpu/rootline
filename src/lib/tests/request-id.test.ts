// Tests for request id creation and parsing.
import { describe, expect, it } from "vitest";
import { isValidRequestId, newRequestId, readRequestIdFromCookie } from "../request-id";

describe("request ids", () => {
  it("creates ids in the req_ + 12 hex format", () => {
    expect(newRequestId()).toMatch(/^req_[a-f0-9]{12}$/);
  });

  it("creates a different id each time", () => {
    expect(newRequestId()).not.toBe(newRequestId());
  });

  it("rejects values that are not our ids", () => {
    expect(isValidRequestId("hello")).toBe(false);
    expect(isValidRequestId(null)).toBe(false);
    expect(isValidRequestId("req_ABCDEF123456")).toBe(false);
  });

  it("reads the id from a cookie string", () => {
    expect(readRequestIdFromCookie("theme=light; rl_rid=req_0123456789ab; other=1")).toBe("req_0123456789ab");
  });

  it("ignores a missing or tampered cookie", () => {
    expect(readRequestIdFromCookie("theme=light")).toBeUndefined();
    expect(readRequestIdFromCookie("rl_rid=<script>")).toBeUndefined();
  });
});
