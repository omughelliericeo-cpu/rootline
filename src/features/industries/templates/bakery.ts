// Bakery template.
import type { IndustryTemplateInput } from "../template.schema";

export const bakery: IndustryTemplateInput = {
  id: "bakery",
  name: "Bakery",
  description: "Bread, pastries and cakes, baked fresh.",
  labels: { place: "Bakery", maker: "Baker", product: "Bake", products: "Bakes", batch: "Bake", batches: "Bakes" },
  sourceTypes: [
    { id: "flour-mill", label: "Flour mill" },
    { id: "dairy", label: "Dairy" },
    { id: "egg-farm", label: "Egg farm" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "weight", label: "Weight", kind: "number", unit: "g" },
    { key: "bestWithinDays", label: "Best within", kind: "number", unit: "days" },
  ],
  batchFields: [],
  dates: { made: { label: "Baked", includesTime: true }, packaged: null },
  freshness: { from: "madeAt", style: "timeToday", verb: "Baked" },
  allowedBadges: [
    { id: "organic", label: "Organic" },
    { id: "nut-free-facility", label: "Nut-free facility" },
    { id: "b-corp", label: "B Corp" },
  ],
  defaultStopTypes: [
    { id: "bakery", label: "Bakery" },
    { id: "store", label: "Store or market" },
  ],
  ownStopType: "bakery",
  starterIngredients: ["Flour", "Water", "Salt", "Yeast", "Sourdough starter", "Butter", "Milk", "Eggs", "Sugar"],
  starterAllergens: ["Wheat", "Milk", "Eggs", "Sesame", "Soy", "Tree nuts", "Peanuts"],
  dietaryTags: ["Vegan", "Vegetarian", "Dairy-free"],
};
