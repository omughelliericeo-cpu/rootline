// "Other" template: for producers whose industry has no template yet (sauces,
// preserves, honey, chocolate, crafts...). Neutral words that fit most things;
// a dedicated template can replace it later.
import type { IndustryTemplateInput } from "../template.schema";

export const other: IndustryTemplateInput = {
  id: "other",
  name: "Something else",
  description: "Honey, preserves, sauces, chocolate and more.",
  labels: { place: "Business", maker: "Maker", product: "Product", products: "Products", batch: "Batch", batches: "Batches" },
  sourceTypes: [
    { id: "farm", label: "Farm" },
    { id: "producer", label: "Producer or maker" },
    { id: "ingredient-supplier", label: "Ingredient supplier" },
    { id: "packaging", label: "Packaging supplier" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "size", label: "Size", kind: "text", hint: "For example 250 g jar or 500 ml bottle" },
    { key: "storage", label: "Storage", kind: "text", hint: "For example Keep refrigerated after opening" },
  ],
  batchFields: [{ key: "bestBefore", label: "Best before", kind: "date" }],
  dates: { made: { label: "Made" }, packaged: { label: "Packed" } },
  freshness: { from: "madeAt", style: "daysAgo", verb: "Made" },
  allowedBadges: [
    { id: "organic", label: "Organic" },
    { id: "fair-trade", label: "Fair trade" },
    { id: "non-gmo", label: "Non-GMO" },
    { id: "b-corp", label: "B Corp" },
  ],
  defaultStopTypes: [
    { id: "workshop", label: "Kitchen or workshop" },
    { id: "distributor", label: "Distributor" },
    { id: "store", label: "Store or market" },
  ],
  ownStopType: "workshop",
  starterIngredients: [],
  starterAllergens: ["Milk", "Eggs", "Peanuts", "Tree nuts", "Wheat", "Soy", "Sesame"],
  dietaryTags: ["Vegan", "Vegetarian", "Gluten-free"],
};
