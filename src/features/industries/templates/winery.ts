// Winery template. The harvest date sets the vintage shown on the story page.
import type { IndustryTemplateInput } from "../template.schema";

export const winery: IndustryTemplateInput = {
  id: "winery",
  name: "Winery",
  labels: { place: "Winery", maker: "Winemaker", product: "Wine", products: "Wines", batch: "Bottling", batches: "Bottlings" },
  sourceTypes: [
    { id: "vineyard", label: "Vineyard" },
    { id: "grape-grower", label: "Grape grower" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "varietal", label: "Grape variety", kind: "text" },
    { key: "abv", label: "Alcohol", kind: "number", unit: "%", required: true },
    { key: "sweetness", label: "Sweetness", kind: "select", options: ["Dry", "Off-dry", "Sweet"] },
  ],
  batchFields: [],
  dates: { made: { label: "Harvested" }, packaged: { label: "Bottled" } },
  freshness: { from: "madeAt", style: "year", verb: "Vintage" },
  allowedBadges: [
    { id: "organic", label: "Organic" },
    { id: "vqa", label: "VQA" },
    { id: "sustainable-winegrowing", label: "Sustainable Winegrowing" },
  ],
  defaultStopTypes: [
    { id: "vineyard", label: "Vineyard" },
    { id: "winery", label: "Winery" },
    { id: "distributor", label: "Distributor" },
    { id: "store", label: "Store" },
  ],
  ownStopType: "winery",
  starterIngredients: ["Grapes", "Yeast", "Sulphites"],
  starterAllergens: ["Sulphites", "Egg (fining)", "Milk (fining)"],
  dietaryTags: ["Vegan", "Unfined"],
};
