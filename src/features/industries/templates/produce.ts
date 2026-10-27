// Fruits & vegetables template: market gardens, orchards and berry farms.
import type { IndustryTemplateInput } from "../template.schema";

export const produce: IndustryTemplateInput = {
  id: "produce",
  name: "Fruits & vegetables",
  description: "Fresh produce from your fields, orchards or greenhouses.",
  labels: { place: "Farm", maker: "Grower", product: "Product", products: "Products", batch: "Harvest", batches: "Harvests" },
  sourceTypes: [
    { id: "own-field", label: "Our own field or orchard" },
    { id: "partner-farm", label: "Partner farm" },
    { id: "seed-supplier", label: "Seed or plant supplier" },
    { id: "soil-supplier", label: "Soil, compost or feed supplier" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "variety", label: "Variety", kind: "text", hint: "For example Honeycrisp or Rainbow carrots" },
    { key: "growingMethod", label: "Grown", kind: "select", options: ["In the field", "In a greenhouse", "Hydroponically"] },
    { key: "packSize", label: "Pack size", kind: "text", hint: "For example 1 lb bag or 6 per bunch" },
  ],
  batchFields: [{ key: "plot", label: "Field or block", kind: "text", hint: "Where on the farm this harvest was picked" }],
  dates: { made: { label: "Harvested" }, packaged: { label: "Packed" } },
  freshness: { from: "madeAt", style: "daysAgo", verb: "Harvested" },
  allowedBadges: [
    { id: "organic", label: "Organic" },
    { id: "non-gmo", label: "Non-GMO" },
    { id: "certified-naturally-grown", label: "Certified Naturally Grown" },
    { id: "salmon-safe", label: "Salmon-Safe" },
  ],
  defaultStopTypes: [
    { id: "farm", label: "Farm" },
    { id: "packing-house", label: "Packing house" },
    { id: "distributor", label: "Distributor" },
    { id: "store", label: "Store or market" },
  ],
  ownStopType: "farm",
  starterIngredients: [],
  starterAllergens: [],
  dietaryTags: ["Vegan", "Vegetarian", "Gluten-free"],
};
