// Poultry & eggs template.
import type { IndustryTemplateInput } from "../template.schema";

export const poultry: IndustryTemplateInput = {
  id: "poultry",
  name: "Poultry & eggs",
  description: "Eggs and poultry from your own flock.",
  labels: { place: "Farm", maker: "Farmer", product: "Product", products: "Products", batch: "Lot", batches: "Lots" },
  sourceTypes: [
    { id: "farm", label: "Farm" },
    { id: "flock", label: "Flock" },
    { id: "feed", label: "Feed supplier" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "grade", label: "Grade", kind: "select", options: ["A", "B"] },
    { key: "size", label: "Size", kind: "select", options: ["Medium", "Large", "Extra large", "Jumbo"] },
    { key: "count", label: "Pack size", kind: "number", unit: "eggs" },
  ],
  batchFields: [{ key: "flockName", label: "Flock", kind: "text", hint: "Which flock laid this lot" }],
  dates: { made: { label: "Laid", byVerb: "Collected" }, packaged: { label: "Graded and packed" } },
  freshness: { from: "madeAt", style: "daysAgo", verb: "Laid" },
  allowedBadges: [
    { id: "pasture-raised", label: "Pasture-raised" },
    { id: "free-run", label: "Free-run" },
    { id: "organic", label: "Organic" },
    { id: "certified-humane", label: "Certified Humane" },
  ],
  defaultStopTypes: [
    { id: "farm", label: "Farm" },
    { id: "grading-station", label: "Grading station" },
    { id: "store", label: "Store or market" },
  ],
  ownStopType: "farm",
  starterIngredients: ["Eggs"],
  starterAllergens: ["Eggs"],
  dietaryTags: ["Vegetarian"],
};
