// Tests for building the story page: wording, freshness, which badges show,
// sources and the map points.
import { describe, expect, it } from "vitest";
import { buildStory, ingredientsHeading, storyBadges, type RawStory } from "../service";

const NOW = new Date("2026-10-24T17:00:00Z"); // 10am in Vancouver
const day = (key: string) => new Date(`${key}T00:00:00Z`);

function rawStory(over: Partial<RawStory> = {}): RawStory {
  return {
    batch: { id: "b1", code: "cedarpm2", number: 214, status: "LIVE", madeAt: new Date("2026-10-01T19:00:00Z"), packagedAt: new Date("2026-10-15T19:00:00Z") },
    product: { id: "p1", name: "Hazy Pale Ale", format: "473 ml can", ingredients: ["Water", "Malted barley", "Oats", "Hops"], allergens: ["Gluten (barley)"], dietaryTags: [], photoPath: null },
    brand: {
      name: "Cedar & Tide",
      location: "Port Moody, BC",
      industry: "brewery",
      timezone: "America/Vancouver",
      logoPath: null,
      photoPaths: ["brand/photo/1.jpg"],
      colorPrimary: "#2F4A3A",
      quote: "We drive up to Armstrong every harvest.",
      videoUrl: null,
      billing: { plan: "GROWTH", trialEndsAt: null, subscriptionStatus: null, currentPeriodEnd: null },
    },
    people: [{ name: "Jess Ramirez", role: "Head brewer", photoPath: null }],
    lots: [
      { ingredient: "Pilsner malt", lotNumber: "KF-118", supplier: { id: "s1", name: "Kowalski Farm", sourceType: "maltster", address: "Armstrong, BC", latitude: 50.44, longitude: -119.19, photoPath: "brand/supplier/farm.jpg" } },
      { ingredient: "Citra hops", lotNumber: "SH-42", supplier: { id: "s2", name: "Singh Hop Farm", sourceType: "hop-farm", address: "Lillooet, BC", latitude: 50.68, longitude: -121.93, photoPath: null } },
      { ingredient: "Pale malt", lotNumber: "KF-119", supplier: { id: "s1", name: "Kowalski Farm", sourceType: "maltster", address: "Armstrong, BC", latitude: 50.44, longitude: -119.19, photoPath: "brand/supplier/farm.jpg" } },
    ],
    stops: [
      { name: "Cedar & Tide", type: "brewery", address: "Port Moody", latitude: 49.28, longitude: -122.83, arrivedOn: "2026-10-15", note: null },
      { name: "Coquitlam cold storage", type: "cold-storage", address: "Coquitlam", latitude: 49.25, longitude: -122.8, arrivedOn: null, note: "Held at 3°C" },
    ],
    certificates: [],
    recalls: [],
    shopperPhotos: [],
    ...over,
  };
}

const cert = (over: Partial<RawStory["certificates"][number]>) => ({
  id: "c1",
  claim: "b-corp",
  issuer: "B Lab",
  status: "VALID" as const,
  expiresOn: day("2028-01-01"),
  filePath: "brand/certificate/c1.pdf",
  productId: null,
  supplierId: null,
  ...over,
});

describe("buildStory wording", () => {
  const story = buildStory(rawStory(), NOW);

  it("names the batch in the industry's words", () => {
    expect(story.eyebrow).toBe("Brew 214 · Hazy Pale Ale");
    expect(story.title).toBe("Hazy Pale Ale, Brew 214");
  });

  it("credits the first person and the brand's town", () => {
    expect(story.headline).toBe("Brewed by Jess in Port Moody, BC.");
    expect(buildStory(rawStory({ people: [] }), NOW).headline).toBe("Brewed in Port Moody, BC.");
  });

  it("uses the template's headline verb where the date label would read wrongly", () => {
    const eggs = rawStory();
    eggs.brand = { ...eggs.brand, industry: "poultry" };
    expect(buildStory(eggs, NOW).headline).toBe("Collected by Jess in Port Moody, BC.");
  });

  it("shows the freshness line from the template", () => {
    expect(story.freshness).toBe("Canned 9 days ago");
  });

  it("falls back to the brand's first photo when the product has none", () => {
    expect(story.photoPath).toBe("brand/photo/1.jpg");
  });

  it("offers the industry's general photo for a banner when there is no photo at all", () => {
    expect(story.fallbackPhotoUrl).toBe("/photos/industries/brewery.jpg");
  });

  it("attributes the quote to the first person", () => {
    expect(story.quote).toEqual({ text: "We drive up to Armstrong every harvest.", by: "Jess Ramirez, head brewer" });
    expect(story.peopleHeading).toBe("The people behind your beer");
  });

  it("says when a batch has sold out", () => {
    expect(buildStory(rawStory({ batch: { ...rawStory().batch, status: "SOLD_OUT" } }), NOW).soldOut).toBe(true);
  });
});

describe("ingredientsHeading", () => {
  it("counts in words", () => {
    expect(ingredientsHeading(4)).toBe("Four ingredients. Nothing hidden.");
    expect(ingredientsHeading(1)).toBe("One ingredient. Nothing hidden.");
    expect(ingredientsHeading(15)).toBe("15 ingredients. Nothing hidden.");
    expect(ingredientsHeading(0)).toBeNull();
  });
});

describe("storyBadges (verified claims only)", () => {
  it("shows a brand-wide valid certificate, linked to its file, with who issued it", () => {
    expect(storyBadges(rawStory({ certificates: [cert({})] }), NOW)).toEqual([{ id: "b-corp", label: "B Corp", certificateId: "c1", issuer: "B Lab" }]);
  });

  it("hides expired and revoked certificates", () => {
    const certificates = [cert({ expiresOn: day("2026-10-23") }), cert({ id: "c2", status: "REVOKED" })];
    expect(storyBadges(rawStory({ certificates }), NOW)).toEqual([]);
  });

  it("shows a product certificate only on that product's batches", () => {
    expect(storyBadges(rawStory({ certificates: [cert({ claim: "organic", productId: "p1" })] }), NOW)).toHaveLength(1);
    expect(storyBadges(rawStory({ certificates: [cert({ claim: "organic", productId: "other-product" })] }), NOW)).toEqual([]);
  });

  it("shows a supplier certificate only when that supplier's lot went in", () => {
    expect(storyBadges(rawStory({ certificates: [cert({ claim: "local-hops", supplierId: "s2" })] }), NOW)).toHaveLength(1);
    expect(storyBadges(rawStory({ certificates: [cert({ claim: "local-hops", supplierId: "s9" })] }), NOW)).toEqual([]);
  });

  it("never shows a claim the industry does not allow", () => {
    expect(storyBadges(rawStory({ certificates: [cert({ claim: "vqa" })] }), NOW)).toEqual([]);
  });

  it("links to a valid certificate when an expired one has the same claim", () => {
    const certificates = [cert({ id: "old", expiresOn: day("2025-01-01") }), cert({ id: "new" })];
    expect(storyBadges(rawStory({ certificates }), NOW)[0]?.certificateId).toBe("new");
  });
});

describe("journey", () => {
  const story = buildStory(rawStory(), NOW);

  it("groups lots by supplier", () => {
    expect(story.sources.map((source) => [source.name, source.supplies, source.lotNumbers])).toEqual([
      ["Kowalski Farm", ["Pilsner malt", "Pale malt"], ["KF-118", "KF-119"]],
      ["Singh Hop Farm", ["Citra hops"], ["SH-42"]],
    ]);
    expect(story.sourcesSummary).toBe("Pilsner malt and Pale malt from Kowalski Farm, Citra hops from Singh Hop Farm");
  });

  it("keeps each supplier's optional photo", () => {
    expect(story.sources.map((source) => source.photoPath)).toEqual(["brand/supplier/farm.jpg", null]);
  });

  it("numbers the stops and formats their dates", () => {
    expect(story.stops.map((stop) => [stop.number, stop.typeLabel, stop.dateText])).toEqual([
      [1, "Brewery", "Oct 15"],
      [2, "Cold storage", null],
    ]);
  });

  it("puts sources first on the map, then stops with a position", () => {
    const noPosition = rawStory({ stops: [...rawStory().stops, { name: "Store", type: "store", address: "", latitude: null, longitude: null, arrivedOn: null, note: null }] });
    expect(buildStory(noPosition, NOW).mapPoints.map((point) => [point.kind, point.label])).toEqual([
      ["source", ""],
      ["source", ""],
      ["stop", "1"],
      ["stop", "2"],
    ]);
  });
});
