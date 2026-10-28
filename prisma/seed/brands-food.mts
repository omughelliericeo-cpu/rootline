// Demo brands for food: Briar Creek Farm (poultry & eggs) and Sunfield
// Organics (fruits & vegetables). Fictional businesses in real BC places;
// lot numbers and certificates are samples.
import type { DemoBrand } from "./build.mjs";

const PASSWORD = "Rootline-demo-2026";

export const briarCreek: DemoBrand = {
  email: "demo@briarcreek.test",
  password: PASSWORD,
  industry: "poultry",
  name: "Briar Creek Farm",
  location: { address: "Abbotsford, BC", latitude: 49.0504, longitude: -122.3045 },
  quote: "Our hens are out on grass every day the weather lets them. You can taste it in the yolks.",
  people: [
    { name: "Ana Silva", role: "Farmer" },
    { name: "Joe Silva", role: "Flock manager" },
  ],
  suppliers: [
    { key: "flock", name: "Briar Creek north pasture flock", sourceType: "flock", supplies: "Eggs", address: "Abbotsford, BC", latitude: 49.0581, longitude: -122.2961 },
    { key: "feed", name: "Fraser Valley Feed Co-op", sourceType: "feed", supplies: "Layer feed", address: "Chilliwack, BC", latitude: 49.1579, longitude: -121.9514 },
  ],
  product: {
    name: "Pasture-raised Large Brown Eggs",
    format: "Dozen",
    ingredients: ["Eggs"],
    allergens: ["Eggs"],
    dietaryTags: ["Vegetarian"],
    extra: { grade: "A", size: "Large", count: 12 },
  },
  certificates: [
    { claim: "pasture-raised", issuer: "Certified Humane Canada", expiresInDays: 220 },
    { claim: "certified-humane", issuer: "Certified Humane Canada", expiresInDays: 220 },
  ],
  batch: {
    code: "eggsfrm2",
    number: 1042,
    madeDaysAgo: 2,
    packagedDaysAgo: 1,
    extra: { flockName: "North pasture flock" },
    lots: [
      { supplier: "flock", ingredient: "Eggs", lotNumber: "BC-N-1042" },
      { supplier: "feed", ingredient: "Layer feed", lotNumber: "FVF-2026-77" },
    ],
    stops: [
      { name: "Briar Creek Farm", type: "farm", address: "Abbotsford, BC", latitude: 49.0504, longitude: -122.3045, daysAgo: 2 },
      { name: "Fraser Valley grading station", type: "grading-station", address: "Langley, BC", latitude: 49.1044, longitude: -122.6604, daysAgo: 1, note: "Graded A, packed by the dozen" },
      { name: "Kitsilano grocer", type: "store", address: "W Broadway, Vancouver, BC", latitude: 49.2639, longitude: -123.1638, daysAgo: 0 },
    ],
  },
  scansPerDay: 7,
};

export const sunfield: DemoBrand = {
  email: "demo@sunfield.test",
  password: PASSWORD,
  industry: "produce",
  name: "Sunfield Organics",
  location: { address: "Cawston, BC", latitude: 49.1806, longitude: -119.764 },
  quote: "Three generations on the same orchard in the Similkameen. We pick when the apples are ready, not when the truck is.",
  people: [
    { name: "Priya Nair", role: "Grower" },
    { name: "Raj Nair", role: "Orchard manager" },
  ],
  suppliers: [
    { key: "orchard", name: "Sunfield north orchard", sourceType: "own-field", supplies: "Honeycrisp apples", address: "Cawston, BC", latitude: 49.1861, longitude: -119.7702 },
    { key: "compost", name: "Similkameen Compost Co.", sourceType: "soil-supplier", supplies: "Orchard compost", address: "Keremeos, BC", latitude: 49.2026, longitude: -119.8294 },
  ],
  product: {
    name: "Honeycrisp Apples",
    format: "3 lb bag",
    ingredients: ["Apples"],
    allergens: [],
    dietaryTags: ["Vegan", "Vegetarian", "Gluten-free"],
    extra: { variety: "Honeycrisp", growingMethod: "In the field", packSize: "3 lb bag" },
  },
  certificates: [
    { claim: "organic", issuer: "Pacific Agricultural Certification Society", expiresInDays: 260 },
    { claim: "salmon-safe", issuer: "Salmon-Safe BC", expiresInDays: 180 },
  ],
  batch: {
    code: "harvest7",
    number: 12,
    madeDaysAgo: 4,
    packagedDaysAgo: 3,
    extra: { plot: "North orchard, block 3" },
    lots: [
      { supplier: "orchard", ingredient: "Honeycrisp apples", lotNumber: "SF-N3-12" },
      { supplier: "compost", ingredient: "Orchard compost (spring)", lotNumber: "SCC-26-04" },
    ],
    stops: [
      { name: "Sunfield north orchard", type: "farm", address: "Cawston, BC", latitude: 49.1861, longitude: -119.7702, daysAgo: 4 },
      { name: "Keremeos packing house", type: "packing-house", address: "Keremeos, BC", latitude: 49.2026, longitude: -119.8294, daysAgo: 3, note: "Washed, sorted and bagged" },
      { name: "Okanagan produce distributor", type: "distributor", address: "Kelowna, BC", latitude: 49.888, longitude: -119.496, daysAgo: 2 },
      { name: "Trout Lake Farmers Market", type: "store", address: "Vancouver, BC", latitude: 49.2556, longitude: -123.0624, daysAgo: 1 },
    ],
  },
  scansPerDay: 9,
};
