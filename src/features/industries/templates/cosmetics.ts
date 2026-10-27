// Cosmetics & skincare template: small-batch makers of soap, balms, creams,
// serums and oils. "Ingredients" are listed as on the label; "allergens" holds
// common skin allergens (fragrance allergens, nut oils).
import type { IndustryTemplateInput } from "../template.schema";

export const cosmetics: IndustryTemplateInput = {
  id: "cosmetics",
  name: "Cosmetics & skincare",
  description: "Soaps, balms, creams and oils, made in small batches.",
  labels: { place: "Studio", maker: "Maker", product: "Product", products: "Products", batch: "Batch", batches: "Batches" },
  sourceTypes: [
    { id: "botanical-farm", label: "Botanical or herb farm" },
    { id: "apiary", label: "Apiary (beeswax, honey)" },
    { id: "oil-supplier", label: "Oil or butter supplier" },
    { id: "ingredient-supplier", label: "Ingredient supplier" },
    { id: "packaging", label: "Packaging supplier" },
    { id: "other", label: "Other supplier" },
  ],
  productFields: [
    { key: "productType", label: "Type", kind: "select", options: ["Soap", "Balm or salve", "Cream or lotion", "Serum or oil", "Cleanser", "Other"] },
    { key: "skinType", label: "Suited to", kind: "text", hint: "For example All skin types or Dry skin" },
    { key: "size", label: "Size", kind: "number", unit: "ml" },
    { key: "paoMonths", label: "Use within (after opening)", kind: "number", unit: "months" },
  ],
  batchFields: [{ key: "bestBefore", label: "Best before", kind: "date" }],
  dates: { made: { label: "Made" }, packaged: { label: "Filled" } },
  freshness: { from: "madeAt", style: "daysAgo", verb: "Made" },
  allowedBadges: [
    { id: "cruelty-free", label: "Cruelty-free" },
    { id: "vegan", label: "Certified vegan" },
    { id: "organic", label: "Certified organic" },
    { id: "natural", label: "Certified natural" },
    { id: "b-corp", label: "B Corp" },
  ],
  defaultStopTypes: [
    { id: "studio", label: "Studio" },
    { id: "distributor", label: "Distributor" },
    { id: "store", label: "Store or market" },
  ],
  ownStopType: "studio",
  starterIngredients: ["Shea butter", "Coconut oil", "Olive oil", "Beeswax", "Essential oils", "Water (aqua)"],
  starterAllergens: ["Fragrance allergens", "Nut oils", "Beeswax", "Lanolin"],
  dietaryTags: ["Vegan", "Fragrance-free", "Palm-oil free"],
};
