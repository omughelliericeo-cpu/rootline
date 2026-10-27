// Demo brands for drinks: Cedar & Tide (brewery, the main demo), Blackbird
// Ridge (winery) and Ridgeline Roasters (coffee). Fictional businesses in real
// BC places; lot numbers and certificates are samples.
import type { DemoBrand } from "./build.mjs";

const PASSWORD = "Rootline-demo-2026";

export const cedarAndTide: DemoBrand = {
  email: "demo@cedarandtide.test",
  password: process.env.SEED_DEMO_PASSWORD ?? "CedarTide-demo-2026",
  industry: "brewery",
  name: "Cedar & Tide",
  location: { address: "Port Moody, BC", latitude: 49.2838, longitude: -122.8317 },
  quote: "We drive up to Armstrong every harvest. I want to know the guy who grew the barley by name.",
  people: [
    { name: "Jess Ramirez", role: "Head brewer" },
    { name: "Dan Kowalski", role: "Barley farmer, Armstrong" },
    { name: "The Singh family", role: "Hop growers, Lillooet" },
  ],
  suppliers: [
    { key: "kowalski", name: "Kowalski Farm", sourceType: "maltster", supplies: "Barley", address: "Armstrong, BC", latitude: 50.4481, longitude: -119.1964 },
    { key: "singh", name: "Singh Hop Farm", sourceType: "hop-farm", supplies: "Hops", address: "Lillooet, BC", latitude: 50.6866, longitude: -121.9361 },
  ],
  product: {
    name: "Hazy Pale Ale",
    format: "473 ml can",
    ingredients: ["Water", "Malted barley", "Oats", "Hops", "Yeast"],
    allergens: ["Gluten (barley)", "Gluten (oats)"],
    dietaryTags: [],
    extra: { style: "Hazy Pale Ale", abv: 6.2, ibu: 35 },
  },
  certificates: [
    { claim: "b-corp", issuer: "B Lab", expiresInDays: 700 },
    // Runs out soon, so the dashboard shows one to renew.
    { claim: "organic", issuer: "BC Certified Organic", expiresInDays: 18, productOnly: true },
  ],
  batch: {
    code: "cedarpm2",
    number: 214,
    madeDaysAgo: 23,
    packagedDaysAgo: 9,
    lots: [
      { supplier: "kowalski", ingredient: "Pilsner malt", lotNumber: "KF-2026-118" },
      { supplier: "singh", ingredient: "Citra hops", lotNumber: "SH-26-042" },
    ],
    stops: [
      { name: "Cedar & Tide, Port Moody", type: "brewery", address: "Port Moody, BC", latitude: 49.2838, longitude: -122.8317, daysAgo: 9 },
      { name: "Coquitlam cold storage", type: "cold-storage", address: "Coquitlam, BC", latitude: 49.2524, longitude: -122.8058, daysAgo: 8, note: "Held at 3°C" },
      { name: "Burnaby warehouse", type: "distributor", address: "Burnaby, BC", latitude: 49.2488, longitude: -122.9805, daysAgo: 7 },
      { name: "Main Street Bottle Shop", type: "store", address: "Main St, Vancouver, BC", latitude: 49.2627, longitude: -123.1007, daysAgo: 5, note: "On the shelf, kept cold" },
    ],
  },
  scansPerDay: 12,
};

export const blackbirdRidge: DemoBrand = {
  email: "demo@blackbirdridge.test",
  password: PASSWORD,
  industry: "winery",
  name: "Blackbird Ridge Winery",
  location: { address: "Oliver, BC", latitude: 49.1829, longitude: -119.5503 },
  quote: "Every bottle starts on the bench above the Okanagan River. We pick the Syrah by hand at first light.",
  people: [
    { name: "Claire Dubois", role: "Winemaker" },
    { name: "Luis Ramos", role: "Grape grower, Osoyoos" },
  ],
  suppliers: [
    { key: "estate", name: "Blackbird Ridge estate vineyard", sourceType: "vineyard", supplies: "Syrah grapes", address: "Oliver, BC", latitude: 49.1912, longitude: -119.5571 },
    { key: "ramos", name: "Ramos Family Vineyard", sourceType: "grape-grower", supplies: "Syrah grapes", address: "Osoyoos, BC", latitude: 49.0323, longitude: -119.4682 },
  ],
  product: {
    name: "Syrah 2025",
    format: "750 ml bottle",
    ingredients: ["Grapes"],
    allergens: ["Sulphites"],
    dietaryTags: ["Vegan"],
    extra: { varietal: "Syrah", abv: 13.8, sweetness: "Dry" },
  },
  certificates: [
    { claim: "vqa", issuer: "BC Wine Authority", expiresInDays: 400, productOnly: true },
    { claim: "sustainable-winegrowing", issuer: "Sustainable Winegrowing BC", expiresInDays: 250 },
  ],
  batch: {
    code: "syrah2v5",
    number: 3,
    madeDaysAgo: 380,
    packagedDaysAgo: 30,
    lots: [
      { supplier: "estate", ingredient: "Syrah, block 2", lotNumber: "BR-B2-2025" },
      { supplier: "ramos", ingredient: "Syrah", lotNumber: "RFV-25-09" },
    ],
    stops: [
      { name: "Blackbird Ridge estate", type: "vineyard", address: "Oliver, BC", latitude: 49.1912, longitude: -119.5571, daysAgo: 380 },
      { name: "Blackbird Ridge Winery", type: "winery", address: "Oliver, BC", latitude: 49.1829, longitude: -119.5503, daysAgo: 30, note: "Aged 11 months in French oak" },
      { name: "Okanagan wine distributors", type: "distributor", address: "Kelowna, BC", latitude: 49.888, longitude: -119.496, daysAgo: 20 },
      { name: "Kitsilano wine shop", type: "store", address: "W 4th Ave, Vancouver, BC", latitude: 49.2684, longitude: -123.1677, daysAgo: 14 },
    ],
  },
  scansPerDay: 5,
};

export const ridgelineRoasters: DemoBrand = {
  email: "demo@ridgeline.test",
  password: PASSWORD,
  industry: "coffee",
  name: "Ridgeline Roasters",
  location: { address: "Nelson, BC", latitude: 49.4928, longitude: -117.2948 },
  quote: "We buy from the same families in Huila every year, and we pay them before the coffee ships.",
  people: [
    { name: "Sam Park", role: "Head roaster" },
    { name: "Marisol Vargas", role: "Coffee farmer, Huila" },
  ],
  suppliers: [
    { key: "finca", name: "Finca El Mirador", sourceType: "farm", supplies: "Green coffee", address: "Huila, Colombia", latitude: 2.5359, longitude: -75.5277 },
    { key: "importer", name: "Pacific Green Coffee Importers", sourceType: "importer", supplies: "Shipping and import", address: "Vancouver, BC", latitude: 49.2827, longitude: -123.1207 },
  ],
  product: {
    name: "Huila Single Origin",
    format: "340 g bag",
    ingredients: ["Coffee beans"],
    allergens: [],
    dietaryTags: ["Vegan"],
    extra: { origin: "Huila, Colombia", process: "Washed", roastLevel: "Medium", weight: 340 },
  },
  certificates: [
    { claim: "fair-trade", issuer: "Fairtrade Canada", expiresInDays: 300, productOnly: true },
    { claim: "organic", issuer: "Canada Organic", expiresInDays: 200, productOnly: true },
  ],
  batch: {
    code: "kaffe247",
    number: 57,
    madeDaysAgo: 5,
    packagedDaysAgo: 5,
    extra: { harvested: "2026-05-15" },
    lots: [
      { supplier: "finca", ingredient: "Green coffee, Caturra", lotNumber: "FEM-2026-07" },
      { supplier: "importer", ingredient: "Import shipment", lotNumber: "PGC-4471" },
    ],
    stops: [
      { name: "Finca El Mirador", type: "farm", address: "Huila, Colombia", latitude: 2.5359, longitude: -75.5277, daysAgo: 95 },
      { name: "Port of Vancouver", type: "port", address: "Vancouver, BC", latitude: 49.2894, longitude: -123.1094, daysAgo: 40 },
      { name: "Ridgeline Roasters", type: "roastery", address: "Nelson, BC", latitude: 49.4928, longitude: -117.2948, daysAgo: 5, note: "Roasted to medium, 12 minutes" },
      { name: "Baker Street café", type: "store", address: "Baker St, Nelson, BC", latitude: 49.4935, longitude: -117.2939, daysAgo: 3 },
    ],
  },
  scansPerDay: 8,
};
