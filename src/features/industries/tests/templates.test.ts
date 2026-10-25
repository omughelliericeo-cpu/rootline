// Every industry template must pass the shared schema and be registered.
// Adding a new industry: its template is checked here automatically.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getTemplate, industryOptions, isIndustryId, listTemplates } from "../registry";
import { templateSchema } from "../template.schema";
import { TEMPLATE_FILES } from "../templates";

const templatesDir = fileURLToPath(new URL("../templates", import.meta.url));

describe("industry templates", () => {
  it.each(TEMPLATE_FILES.map((t) => [t.id, t]))("%s passes the template schema", (_id, template) => {
    const result = templateSchema.safeParse(template);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it("registers every template file in templates/index.ts", () => {
    const files = readdirSync(templatesDir)
      .filter((name) => name.endsWith(".ts") && name !== "index.ts")
      .map((name) => name.replace(/\.ts$/, ""))
      .sort();
    expect(TEMPLATE_FILES.map((t) => t.id).sort()).toEqual(files);
  });

  it("has unique industry ids", () => {
    const ids = listTemplates().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(listTemplates().map((t) => [t.id, t]))("%s has unique option and field ids", (_id, template) => {
    const groups = [
      template.sourceTypes.map((o) => o.id),
      template.allowedBadges.map((o) => o.id),
      template.defaultStopTypes.map((o) => o.id),
      [...template.productFields, ...template.batchFields].map((f) => f.key),
    ];
    for (const ids of groups) expect(new Set(ids).size).toBe(ids.length);
  });

  it("offers all five MVP industries in the sign-up dropdown, brewery first", () => {
    expect(industryOptions().map((o) => o.label)).toEqual(["Brewery", "Bakery", "Poultry & eggs", "Coffee", "Winery"]);
  });

  it("looks templates up by id and rejects unknown ids", () => {
    expect(getTemplate("brewery").labels.batch).toBe("Brew");
    expect(isIndustryId("brewery")).toBe(true);
    expect(isIndustryId("distillery")).toBe(false);
    expect(() => getTemplate("distillery")).toThrow('No industry template with id "distillery"');
  });

  it("rejects a template whose freshness uses a packaged date it does not have", () => {
    const broken = { ...TEMPLATE_FILES[1], freshness: { from: "packagedAt", style: "daysAgo", verb: "Baked" } };
    expect(templateSchema.safeParse(broken).success).toBe(false);
  });
});

describe("brewery template (polished industry)", () => {
  const brewery = getTemplate("brewery");

  it("uses brewery words", () => {
    expect(brewery.labels).toMatchObject({ place: "Brewery", batch: "Brew", product: "Beer" });
    expect(brewery.dates.made.label).toBe("Brewed");
    expect(brewery.dates.packaged?.label).toBe("Canned");
  });

  it("allows B Corp and local hops badges", () => {
    expect(brewery.allowedBadges.map((b) => b.id)).toEqual(expect.arrayContaining(["b-corp", "local-hops", "organic"]));
  });

  it("defaults to the brewery, cold storage, distributor, store journey", () => {
    expect(brewery.defaultStopTypes.map((s) => s.label)).toEqual(["Brewery", "Cold storage", "Distributor", "Store"]);
  });

  it("starts with gluten allergens", () => {
    expect(brewery.starterAllergens).toContain("Gluten (barley)");
  });
});
