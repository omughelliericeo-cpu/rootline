// Brewery template: the first fully polished industry (BC craft breweries).
import type { IndustryTemplateInput } from "../template.schema";

export const brewery: IndustryTemplateInput = {
  id: "brewery",
  name: "Brewery",
  labels: { place: "Brewery", maker: "Brewer", product: "Beer", products: "Beers", batch: "Brew", batches: "Brews" },
  sourceTypes: [
    { id: "maltster", label: "Maltster or grain farm" },
    { id: "hop-farm", label: "Hop farm" },
    { id: "water", label: "Water source" },
    { id: "yeast-lab", label: "Yeast lab" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "style", label: "Style", kind: "text", hint: "For example Hazy Pale Ale" },
    { key: "abv", label: "Alcohol", kind: "number", unit: "%", required: true },
    { key: "ibu", label: "Bitterness", kind: "number", unit: "IBU" },
  ],
  batchFields: [{ key: "measuredAbv", label: "Measured alcohol", kind: "number", unit: "%" }],
  dates: { made: { label: "Brewed" }, packaged: { label: "Canned" } },
  freshness: { from: "packagedAt", style: "daysAgo", verb: "Canned" },
  allowedBadges: [
    { id: "b-corp", label: "B Corp" },
    { id: "organic", label: "Organic" },
    { id: "local-hops", label: "Local hops" },
    { id: "gluten-reduced", label: "Gluten-reduced" },
  ],
  defaultStopTypes: [
    { id: "brewery", label: "Brewery" },
    { id: "cold-storage", label: "Cold storage" },
    { id: "distributor", label: "Distributor" },
    { id: "store", label: "Store" },
  ],
  ownStopType: "brewery",
  starterIngredients: ["Water", "Malted barley", "Wheat", "Oats", "Hops", "Yeast"],
  starterAllergens: ["Gluten (barley)", "Gluten (wheat)", "Gluten (oats)", "Sulphites"],
  dietaryTags: ["Vegan", "Gluten-reduced"],
};
