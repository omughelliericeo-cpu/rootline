// Tests for reading the repeated rows of the lots and journey forms.
import { describe, expect, it } from "vitest";
import { lotRows, stopRows } from "../rows";

describe("lotRows", () => {
  const suppliers = new Set(["s1", "s2"]);

  it("zips the columns into lots and skips blank spare rows", () => {
    const { lots, errors } = lotRows(
      { supplierId: ["s1", "", "s2"], ingredient: ["Pilsner malt", "", "Citra hops"], lotNumber: ["KF-118", "", "SH-42"] },
      suppliers,
    );
    expect(errors).toEqual({});
    expect(lots).toEqual([
      { supplierId: "s1", ingredient: "Pilsner malt", lotNumber: "KF-118" },
      { supplierId: "s2", ingredient: "Citra hops", lotNumber: "SH-42" },
    ]);
  });

  it("explains what is missing in a half-filled row", () => {
    const { errors } = lotRows({ supplierId: ["s1"], ingredient: [""], lotNumber: [""] }, suppliers);
    expect(errors).toEqual({ "lots.0": ["Row 1: say what came from them, enter the lot number."] });
  });

  it("refuses a supplier that is not the brand's", () => {
    const { errors } = lotRows({ supplierId: ["someone-else"], ingredient: ["Malt"], lotNumber: ["1"] }, suppliers);
    expect(errors["lots.0"]?.[0]).toMatch(/choose a supplier/);
  });
});

describe("stopRows", () => {
  const types = new Set(["brewery", "store"]);

  it("reads stops in order, with optional map position, date and note", () => {
    const { stops, errors } = stopRows(
      {
        name: ["Port Moody brewery", "Vancouver store", ""],
        type: ["brewery", "store", "brewery"],
        address: ["2711 Murray St", "", ""],
        coordinates: ["49.2838, -122.8317", "", ""],
        arrivedOn: ["2026-10-10", "", ""],
        note: ["", "Kept at 3°C", ""],
      },
      types,
    );
    expect(errors).toEqual({});
    expect(stops).toEqual([
      { name: "Port Moody brewery", type: "brewery", address: "2711 Murray St", latitude: 49.2838, longitude: -122.8317, arrivedOn: "2026-10-10", note: null },
      { name: "Vancouver store", type: "store", address: "", latitude: null, longitude: null, arrivedOn: null, note: "Kept at 3°C" },
    ]);
  });

  it("reports bad map positions and unknown types", () => {
    const { errors } = stopRows({ name: ["Somewhere"], type: ["castle"], coordinates: ["north-ish"] }, types);
    expect(errors["stops.0"]?.[0]).toBe("Stop 1: choose a type, enter the map position as latitude, longitude.");
  });
});
