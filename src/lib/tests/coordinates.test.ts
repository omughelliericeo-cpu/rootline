// Tests for reading and writing map positions.
import { describe, expect, it } from "vitest";
import { formatCoordinates, parseCoordinates } from "../coordinates";

describe("parseCoordinates", () => {
  it("reads what map apps copy", () => {
    expect(parseCoordinates("50.4148, -119.1937")).toEqual({ latitude: 50.4148, longitude: -119.1937 });
    expect(parseCoordinates("50.4148,-119.1937")).toEqual({ latitude: 50.4148, longitude: -119.1937 });
    expect(parseCoordinates("  50.4148 -119.1937 ")).toEqual({ latitude: 50.4148, longitude: -119.1937 });
  });

  it("rejects text, one number, or out-of-range values", () => {
    expect(parseCoordinates("Armstrong, BC")).toBeNull();
    expect(parseCoordinates("50.4148")).toBeNull();
    expect(parseCoordinates("95, -119")).toBeNull();
    expect(parseCoordinates("50, -190")).toBeNull();
  });

  it("formats back to five decimals", () => {
    expect(formatCoordinates({ latitude: 50.414812345, longitude: -119.19371 })).toBe("50.41481, -119.19371");
  });
});
