// Tests for shopper photo rules and the share form's schema.
import { describe, expect, it } from "vitest";
import { reviewPhotoSchema, sharePhotoSchema } from "../schema";
import { attribution, consentText, firstNameOnly, looksLikeABot, visitorKey } from "../service";

describe("shopper photo rules", () => {
  it("names the brand in the consent wording", () => {
    expect(consentText("Cedar & Tide")).toBe("I took this photo, and Cedar & Tide may show it with my note and first name on this page.");
  });

  it("keeps only a first name, so full names never go public", () => {
    expect(firstNameOnly("  Sam Okafor ")).toBe("Sam");
    expect(firstNameOnly("")).toBeNull();
    expect(firstNameOnly(undefined)).toBeNull();
    expect(attribution(null)).toBe("A shopper");
    expect(attribution("Sam")).toBe("Sam");
  });

  it("spots bots that fill in the hidden field", () => {
    expect(looksLikeABot(undefined)).toBe(false);
    expect(looksLikeABot("")).toBe(false);
    expect(looksLikeABot("http://spam.example")).toBe(true);
  });

  it("uses the first forwarded address for the in-memory limit", () => {
    expect(visitorKey(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(visitorKey(new Headers())).toBe("unknown");
  });
});

describe("sharePhotoSchema", () => {
  const photo = new File([new Uint8Array([1])], "p.jpg", { type: "image/jpeg" });
  const valid = { batchCode: "cedarpm2", photo, consent: "on" };

  it("needs a photo and consent; the note and name are optional", () => {
    expect(sharePhotoSchema.safeParse(valid).success).toBe(true);
    expect(sharePhotoSchema.safeParse({ ...valid, consent: undefined }).success).toBe(false);
    expect(sharePhotoSchema.safeParse({ ...valid, photo: new File([], "") }).success).toBe(false);
    expect(sharePhotoSchema.safeParse({ ...valid, note: "", firstName: "" }).data).toMatchObject({ note: undefined, firstName: undefined });
  });

  it("limits the note to 280 characters", () => {
    expect(sharePhotoSchema.safeParse({ ...valid, note: "a".repeat(280) }).success).toBe(true);
    expect(sharePhotoSchema.safeParse({ ...valid, note: "a".repeat(281) }).success).toBe(false);
  });
});

describe("reviewPhotoSchema", () => {
  it("only accepts approve or reject", () => {
    const photoId = "00000000-0000-4000-8000-000000000001";
    expect(reviewPhotoSchema.safeParse({ photoId, decision: "approve" }).success).toBe(true);
    expect(reviewPhotoSchema.safeParse({ photoId, decision: "publish" }).success).toBe(false);
  });
});
