// Tests for which uploaded images are accepted and where they are stored.
import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, checkImageFile, storagePathFor } from "../storage-rules";

describe("checkImageFile", () => {
  it("accepts JPG, PNG and WebP under 4 MB", () => {
    expect(checkImageFile({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(checkImageFile({ type: "image/png", size: MAX_IMAGE_BYTES })).toBeNull();
    expect(checkImageFile({ type: "image/webp", size: 1 })).toBeNull();
  });

  it("rejects other types, empty files and large files", () => {
    expect(checkImageFile({ type: "application/pdf", size: 1000 })).toMatch(/JPG, PNG or WebP/);
    expect(checkImageFile({ type: "image/svg+xml", size: 1000 })).toMatch(/JPG, PNG or WebP/);
    expect(checkImageFile({ type: "image/jpeg", size: 0 })).toMatch(/empty/);
    expect(checkImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toMatch(/4 MB/);
  });
});

describe("storagePathFor", () => {
  it("stores files under the brand folder with a random name", () => {
    const path = storagePathFor("brand-1", "logo", "image/png");
    expect(path).toMatch(/^brand-1\/logo\/[0-9a-f-]{36}\.png$/);
    expect(storagePathFor("brand-1", "logo", "image/png")).not.toBe(path);
  });
});
