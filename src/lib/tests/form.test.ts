// Tests for turning HTML form submissions into objects Zod can check.
import { describe, expect, it } from "vitest";
import { formDataToObject, optionalFile, optionalNumber, optionalText, requiredText } from "../form";

describe("formDataToObject", () => {
  it("copies fields, groups [] keys into arrays and skips Next.js internals", () => {
    const form = new FormData();
    form.append("name", "Cedar & Tide");
    form.append("allergens[]", "Gluten");
    form.append("allergens[]", "Sulphites");
    form.append("$ACTION_ID_abc", "");

    expect(formDataToObject(form)).toEqual({ name: "Cedar & Tide", allergens: ["Gluten", "Sulphites"] });
  });

  it("nests one level for dotted names (industry fields)", () => {
    const form = new FormData();
    form.append("extra.abv", "6.2");
    form.append("extra.style", "Hazy");
    expect(formDataToObject(form)).toEqual({ extra: { abv: "6.2", style: "Hazy" } });
  });
});

describe("form field helpers", () => {
  it("requires and trims text", () => {
    expect(requiredText("Name").parse("  Ada ")).toBe("Ada");
    expect(requiredText("Name").safeParse("   ").success).toBe(false);
  });

  it("turns empty optional inputs into undefined", () => {
    expect(optionalText("Quote").parse("")).toBeUndefined();
    expect(optionalNumber("Latitude", -90, 90).parse("")).toBeUndefined();
    expect(optionalFile.parse(new File([], ""))).toBeUndefined();
  });

  it("checks number ranges", () => {
    expect(optionalNumber("Latitude", -90, 90).parse("49.5")).toBe(49.5);
    expect(optionalNumber("Latitude", -90, 90).safeParse("200").success).toBe(false);
  });
});
