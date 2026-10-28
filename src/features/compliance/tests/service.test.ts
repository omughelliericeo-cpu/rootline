// Tests for the compliance record, its CSV, and its PDF.
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { getTemplate } from "@/features/industries";
import { compliancePdf } from "../pdf";
import { buildComplianceRecord, csvCell, toCsv } from "../service";

const input = (industry = "brewery") => ({
  template: getTemplate(industry),
  brand: { name: "Cedar & Tide", location: "Port Moody, BC" },
  product: { name: "Hazy Pale Ale", format: "473 ml can", ingredients: ["Water", "Malted barley"], allergens: ["Gluten (barley)"], extra: { abv: 6.2, style: "" } },
  batch: { number: 214, code: "cedarpm2", status: "LIVE", madeOn: "2026-10-01", packagedOn: "2026-10-15", extra: {} },
  lots: [{ supplierName: "Kowalski Farm", sourceType: "maltster", ingredient: "Pilsner malt", lotNumber: "KF-2026-118", address: "Armstrong, BC", latitude: 50.4481, longitude: -119.1964 }],
  stops: [
    { name: "Port Moody brewery", type: "brewery", address: "Port Moody, BC", latitude: 49.2838, longitude: -122.8317, arrivedOn: "2026-10-15", note: null },
    { name: "Coquitlam cold storage", type: "cold-storage", address: "Coquitlam, BC", latitude: null, longitude: null, arrivedOn: null, note: "Held at 3°C, ok" },
  ],
  exportedAt: new Date("2026-10-25T17:00:00Z"),
});

describe("buildComplianceRecord", () => {
  const record = buildComplianceRecord(input());

  it("uses the industry's words for dates and fields", () => {
    expect(record.title).toBe("Hazy Pale Ale, Brew 214");
    expect(record.details).toEqual(
      expect.arrayContaining([
        ["Beer", "Hazy Pale Ale"],
        ["Alcohol (%)", "6.2"],
        ["Brewed", "2026-10-01"],
        ["Canned", "2026-10-15"],
        ["Status", "Live"],
        ["Allergens", "Gluten (barley)"],
      ]),
    );
  });

  it("leaves out industry fields that were not filled in", () => {
    expect(record.details.some(([label]) => label === "Style")).toBe(false);
  });


  it("labels supplier and stop types from the template", () => {
    expect(record.lots[0]).toMatchObject({ supplier: "Kowalski Farm", type: "Maltster or grain farm", lotNumber: "KF-2026-118" });
    expect(record.stops.map((stop) => stop.type)).toEqual(["Brewery", "Cold storage"]);
  });
});

describe("csvCell", () => {
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell("Port Moody, BC")).toBe('"Port Moody, BC"');
    expect(csvCell('the "best"')).toBe('"the ""best"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
    expect(csvCell(6.2)).toBe("6.2");
    expect(csvCell(null)).toBe("");
  });

  it("defuses text a spreadsheet would run as a formula", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+1 farm")).toBe("'+1 farm");
    expect(csvCell("-122.83")).toBe("'-122.83");
    expect(csvCell(-122.83)).toBe("-122.83");
  });
});

describe("toCsv", () => {
  const csv = toCsv(buildComplianceRecord(input()));

  it("starts with a byte-order mark so Excel reads accents", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("has the details, the lots table and the stops table", () => {
    expect(csv).toContain("Rootline compliance export,\"Hazy Pale Ale, Brew 214\"");
    expect(csv).toContain("1,Kowalski Farm,Maltster or grain farm,Pilsner malt,KF-2026-118,\"Armstrong, BC\",50.4481,-119.1964");
    expect(csv).toContain("2,Coquitlam cold storage,Cold storage,\"Coquitlam, BC\",,,,\"Held at 3°C, ok\"");
  });
});

describe("compliancePdf", () => {
  it("builds a numbered PDF that grows onto more pages when needed", async () => {
    const small = await PDFDocument.load(await compliancePdf(buildComplianceRecord(input())));
    expect(small.getPageCount()).toBe(1);
    const manyStops = Array.from({ length: 60 }, (_, index) => ({ ...input().stops[0]!, name: `Stop ${index + 1}` }));
    const large = await PDFDocument.load(await compliancePdf(buildComplianceRecord({ ...input(), stops: manyStops })));
    expect(large.getPageCount()).toBeGreaterThan(1);
  });
});
