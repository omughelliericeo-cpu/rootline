// Turns a published batch's data into what the story page shows. Pure: no
// database, no clock (the caller passes `now`), so every rule is unit tested.
import { isCertificateValid, visibleBadges, type CertificateFacts } from "@/features/certificates";
import { brandCan, type BrandBilling } from "@/features/billing";
import { freshnessLabel, getTemplate, industryPhotoUrl, optionLabel } from "@/features/industries";
import { journeyPoints, sourcesFrom, stopsFrom, type MapPoint, type SourceView, type StopView } from "./journey";

export type RawStory = {
  batch: { id: string; code: string; number: number; status: string; madeAt: Date; packagedAt: Date | null };
  product: { id: string; name: string; format: string; ingredients: string[]; allergens: string[]; dietaryTags: string[]; photoPath: string | null };
  brand: {
    name: string;
    location: string;
    industry: string;
    timezone: string;
    logoPath: string | null;
    photoPaths: string[];
    colorPrimary: string;
    quote: string | null;
    videoUrl: string | null;
    /** Plan facts: which shopper features this brand's plan includes. */
    billing: BrandBilling;
  };
  people: Array<{ name: string; role: string; photoPath: string | null }>;
  lots: Array<{
    ingredient: string;
    lotNumber: string;
    supplier: { id: string; name: string; sourceType: string; address: string; latitude: number; longitude: number; photoPath: string | null };
  }>;
  stops: Array<{ name: string; type: string; address: string; latitude: number | null; longitude: number | null; arrivedOn: string | null; note: string | null }>;
  certificates: Array<CertificateFacts & { id: string; claim: string; issuer: string; productId: string | null; supplierId: string | null }>;
  /** Recalls the producer has issued for this batch, newest first. */
  recalls: Array<{ subject: string; body: string; sentAt: Date }>;
  /** Shopper photos the producer approved, newest first. */
  shopperPhotos: Array<{ photoPath: string; note: string | null; firstName: string | null }>;
};

export type StoryBadge = { id: string; label: string; certificateId: string; issuer: string };

export type StoryView = {
  brandName: string;
  brandLocation: string;
  eyebrow: string;
  title: string;
  headline: string;
  freshness: string | null;
  soldOut: boolean;
  badges: StoryBadge[];
  photoPath: string | null;
  photoAlt: string;
  /** A general photo for the industry, shown as the banner when the producer has none of their own. */
  fallbackPhotoUrl: string;
  sources: SourceView[];
  sourcesSummary: string;
  stops: StopView[];
  mapPoints: MapPoint[];
  ingredientsHeading: string | null;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  peopleHeading: string;
  people: RawStory["people"];
  quote: { text: string; by: string | null } | null;
  videoUrl: string | null;
  recalls: RawStory["recalls"];
  shopperPhotos: RawStory["shopperPhotos"];
  /** Shopper features the brand's plan includes (recall warnings always show). */
  offers: { recallEmails: boolean; shopperPhotos: boolean };
  timeZone: string;
};

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** "Four ingredients. Nothing hidden." */
export function ingredientsHeading(count: number): string | null {
  if (count === 0) return null;
  const amount = NUMBER_WORDS[count] ?? String(count);
  return `${amount} ${count === 1 ? "ingredient" : "ingredients"}. Nothing hidden.`;
}

/**
 * Badges for this batch: valid certificates for the brand, this product, or a
 * supplier whose lot went into it. Each badge links to one of its certificates.
 */
export function storyBadges(raw: RawStory, now: Date): StoryBadge[] {
  const template = getTemplate(raw.brand.industry);
  const supplierIds = new Set(raw.lots.map((lot) => lot.supplier.id));
  const applicable = raw.certificates.filter(
    (cert) =>
      (cert.productId === null && cert.supplierId === null) ||
      cert.productId === raw.product.id ||
      (cert.supplierId !== null && supplierIds.has(cert.supplierId)),
  );
  return visibleBadges(applicable, template.allowedBadges, now, raw.brand.timezone).map((badge) => {
    const certificate = applicable.find((cert) => cert.claim === badge.id && isCertificateValid(cert, now, raw.brand.timezone))!;
    return { ...badge, certificateId: certificate.id, issuer: certificate.issuer };
  });
}

export function buildStory(raw: RawStory, now: Date): StoryView {
  const template = getTemplate(raw.brand.industry);
  const { labels } = template;
  const maker = raw.people[0];
  const madeVerb = template.dates.made.label;
  const sources = sourcesFrom(raw.lots, (type) => optionLabel(template.sourceTypes, type));
  const stops = stopsFrom(raw.stops, (type) => optionLabel(template.defaultStopTypes, type));

  return {
    brandName: raw.brand.name,
    brandLocation: raw.brand.location,
    eyebrow: `${labels.batch} ${raw.batch.number} · ${raw.product.name}`,
    title: `${raw.product.name}, ${labels.batch} ${raw.batch.number}`,
    headline: maker
      ? `${template.dates.made.byVerb ?? madeVerb} by ${maker.name.split(" ")[0]} in ${raw.brand.location}.`
      : `${madeVerb} in ${raw.brand.location}.`,
    freshness: freshnessLabel(template.freshness, raw.batch, now, raw.brand.timezone),
    soldOut: raw.batch.status === "SOLD_OUT",
    badges: storyBadges(raw, now),
    photoPath: raw.product.photoPath ?? raw.brand.photoPaths[0] ?? null,
    photoAlt: `${raw.product.name} from ${raw.brand.name}`,
    fallbackPhotoUrl: industryPhotoUrl(template.id),
    sources,
    sourcesSummary: sources.map((source) => `${source.supplies.join(" and ")} from ${source.name}`).join(", "),
    stops,
    mapPoints: journeyPoints(sources, stops),
    ingredientsHeading: ingredientsHeading(raw.product.ingredients.length),
    ingredients: raw.product.ingredients,
    allergens: raw.product.allergens,
    dietaryTags: raw.product.dietaryTags,
    peopleHeading: `The people behind your ${labels.product.toLowerCase()}`,
    people: raw.people,
    quote: raw.brand.quote ? { text: raw.brand.quote, by: maker ? `${maker.name}, ${maker.role.toLowerCase()}` : null } : null,
    videoUrl: raw.brand.videoUrl,
    recalls: raw.recalls,
    offers: { recallEmails: brandCan(raw.brand.billing, "recallEmails", now), shopperPhotos: brandCan(raw.brand.billing, "shopperPhotos", now) },
    shopperPhotos: raw.shopperPhotos,
    timeZone: raw.brand.timezone,
  };
}
