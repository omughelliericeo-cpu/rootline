// Tests for building ingredient and allergen lists from the product form.
import { describe, expect, it } from "vitest";
import { productSchema } from "../schema";
import { mergeList, prefixFieldErrors, splitKnown, unknownTags } from "../service";

describe("mergeList", () => {
  it("keeps ticked items first, then typed ones", () => {
    expect(mergeList(["Water", "Malted barley"], "Citra hops, Lactose")).toEqual([
      "Water",
      "Malted barley",
      "Citra hops",
      "Lactose",
    ]);
  });

  it("drops duplicates ignoring case, and blank entries", () => {
    expect(mergeList(["Hops"], "hops,, \n Yeast ")).toEqual(["Hops", "Yeast"]);
  });

  it("handles nothing typed", () => {
    expect(mergeList(["Water"], undefined)).toEqual(["Water"]);
  });
});

describe("splitKnown", () => {
  it("separates tick-box items from typed ones for editing", () => {
    expect(splitKnown(["Water", "Citra hops", "hops"], ["Water", "Hops"])).toEqual({
      ticked: ["Water", "hops"],
      other: "Citra hops",
    });
  });
});

describe("unknownTags", () => {
  it("finds tags the template does not offer", () => {
    expect(unknownTags(["Vegan", "Keto"], ["Vegan", "Gluten-reduced"])).toEqual(["Keto"]);
  });
});

describe("prefixFieldErrors", () => {
  it("matches error keys to the extra.* form names", () => {
    expect(prefixFieldErrors({ abv: ["Required"] }, "extra.")).toEqual({ "extra.abv": ["Required"] });
  });
});

describe("productSchema", () => {
  it("accepts a form with no boxes ticked", () => {
    const parsed = productSchema.parse({ name: "Hazy Pale Ale", format: "473 ml can", extra: { abv: "6.2" } });
    expect(parsed).toMatchObject({ ingredients: [], allergens: [], dietaryTags: [], extra: { abv: "6.2" } });
  });
});
