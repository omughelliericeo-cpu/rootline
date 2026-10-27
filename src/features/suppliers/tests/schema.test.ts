// Tests for the supplier form schema.
import { describe, expect, it } from "vitest";
import { supplierSchema } from "../schema";

describe("supplierSchema", () => {
  const valid = {
    name: "Kowalski Farm",
    sourceType: "maltster",
    supplies: "Pilsner malt",
    address: "Armstrong, BC",
    coordinates: "50.4148, -119.1937",
  };

  it("turns the map position into numbers", () => {
    expect(supplierSchema.parse(valid).coordinates).toEqual({ latitude: 50.4148, longitude: -119.1937 });
  });

  it("treats the photo as optional", () => {
    expect(supplierSchema.parse({ ...valid, photo: new File([], "") }).photo).toBeUndefined();
  });

  it("explains a bad map position", () => {
    const result = supplierSchema.safeParse({ ...valid, coordinates: "near the river" });
    expect(result.error?.issues[0]?.message).toMatch(/latitude and longitude/);
  });
});
