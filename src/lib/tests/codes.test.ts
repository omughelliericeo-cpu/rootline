// Tests for public link codes.
import { describe, expect, it } from "vitest";
import { CODE_LENGTH, isPublicCode, newPublicCode } from "../codes";

describe("public codes", () => {
  it("are 8 easy-to-read characters", () => {
    const code = newPublicCode();
    expect(code).toHaveLength(CODE_LENGTH);
    expect(code).not.toMatch(/[01ilo]/);
    expect(isPublicCode(code)).toBe(true);
  });

  it("differ each time", () => {
    const codes = new Set(Array.from({ length: 200 }, () => newPublicCode()));
    expect(codes.size).toBe(200);
  });

  it("rejects anything that is not a code", () => {
    expect(isPublicCode("ABCDEFGH")).toBe(false);
    expect(isPublicCode("k7m2q9x")).toBe(false);
    expect(isPublicCode("../etc/p")).toBe(false);
  });
});
