// Coffee roaster template. Harvest is a batch field; the roast date drives freshness.
import type { IndustryTemplateInput } from "../template.schema";

export const coffee: IndustryTemplateInput = {
  id: "coffee",
  name: "Coffee",
  description: "Green beans sourced, roasted and packed.",
  labels: { place: "Roastery", maker: "Roaster", product: "Coffee", products: "Coffees", batch: "Roast", batches: "Roasts" },
  sourceTypes: [
    { id: "farm", label: "Farm" },
    { id: "co-op", label: "Co-op" },
    { id: "importer", label: "Importer" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "origin", label: "Origin", kind: "text", hint: "Country and region" },
    { key: "process", label: "Process", kind: "select", options: ["Washed", "Natural", "Honey"] },
    { key: "roastLevel", label: "Roast", kind: "select", options: ["Light", "Medium", "Dark"] },
    { key: "weight", label: "Bag size", kind: "number", unit: "g" },
  ],
  batchFields: [{ key: "harvested", label: "Harvested", kind: "date" }],
  dates: { made: { label: "Roasted" }, packaged: { label: "Bagged" } },
  freshness: { from: "madeAt", style: "daysAgo", verb: "Roasted" },
  allowedBadges: [
    { id: "fair-trade", label: "Fair trade" },
    { id: "organic", label: "Organic" },
    { id: "rainforest-alliance", label: "Rainforest Alliance" },
    { id: "b-corp", label: "B Corp" },
  ],
  defaultStopTypes: [
    { id: "farm", label: "Farm" },
    { id: "port", label: "Port" },
    { id: "roastery", label: "Roastery" },
    { id: "store", label: "Café or store" },
  ],
  ownStopType: "roastery",
  starterIngredients: ["Coffee beans"],
  starterAllergens: [],
  dietaryTags: ["Vegan"],
};
