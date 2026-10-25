// Tests for brand profile rules and form validation.
import { describe, expect, it } from "vitest";
import { brandProfileSchema } from "../schema";
import { MAX_BRAND_PHOTOS, canAddPhoto, isSupportedVideoUrl, nextPersonPosition, withoutPhoto } from "../service";

describe("isSupportedVideoUrl", () => {
  it("accepts YouTube and Vimeo links", () => {
    expect(isSupportedVideoUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isSupportedVideoUrl("https://youtu.be/abc")).toBe(true);
    expect(isSupportedVideoUrl("https://vimeo.com/123")).toBe(true);
  });

  it("rejects other hosts, plain http and junk", () => {
    expect(isSupportedVideoUrl("https://example.com/video.mp4")).toBe(false);
    expect(isSupportedVideoUrl("http://www.youtube.com/watch?v=abc")).toBe(false);
    expect(isSupportedVideoUrl("not a url")).toBe(false);
  });
});

describe("photo rules", () => {
  it("allows photos up to the limit", () => {
    expect(canAddPhoto(0)).toBe(true);
    expect(canAddPhoto(MAX_BRAND_PHOTOS - 1)).toBe(true);
    expect(canAddPhoto(MAX_BRAND_PHOTOS)).toBe(false);
  });

  it("removes only a photo that belongs to the brand", () => {
    expect(withoutPhoto(["a.jpg", "b.jpg"], "a.jpg")).toEqual(["b.jpg"]);
    expect(withoutPhoto(["a.jpg"], "other-brand/x.jpg")).toBeNull();
  });
});

describe("nextPersonPosition", () => {
  it("puts new people at the end", () => {
    expect(nextPersonPosition([])).toBe(0);
    expect(nextPersonPosition([0, 3, 1])).toBe(4);
  });
});

describe("brandProfileSchema", () => {
  const valid = {
    name: "Cedar & Tide",
    location: "Port Moody, BC",
    coordinates: "",
    colorPrimary: "#2F4A3A",
    colorAccent: "#8A5A3B",
    quote: "",
    videoUrl: "",
  };

  it("accepts a minimal profile and turns blanks into undefined", () => {
    expect(brandProfileSchema.parse(valid)).toMatchObject({ name: "Cedar & Tide", quote: undefined, coordinates: undefined });
  });

  it("reads an optional map position, and rejects a half-typed one", () => {
    expect(brandProfileSchema.safeParse({ ...valid, coordinates: "49.28" }).success).toBe(false);
    expect(brandProfileSchema.parse({ ...valid, coordinates: "49.28, -122.83" }).coordinates).toEqual({
      latitude: 49.28,
      longitude: -122.83,
    });
  });

  it("rejects bad colours and non-video links", () => {
    expect(brandProfileSchema.safeParse({ ...valid, colorPrimary: "green" }).success).toBe(false);
    expect(brandProfileSchema.safeParse({ ...valid, videoUrl: "https://example.com" }).success).toBe(false);
  });
});
