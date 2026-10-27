// "What went into it": ingredients, allergens, dietary tags, and where the
// certificates behind the badges can be opened.
import type { StoryView } from "../service";

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-sans text-sm font-semibold">{title}</h3>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

export function IngredientsSection({ story }: { story: StoryView }) {
  if (!story.ingredientsHeading) return null;
  return (
    <section className="flex flex-col gap-5 border-t border-line px-5 py-8" aria-labelledby="ingredients-heading">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">What went into it</p>
      <h2 id="ingredients-heading" className="text-2xl">
        {story.ingredientsHeading}
      </h2>
      <Row title="Ingredients">{story.ingredients.join(", ")}</Row>
      <Row title="Allergens">{story.allergens.length > 0 ? `Contains ${story.allergens.join(", ").toLowerCase()}` : "No allergens listed by the maker."}</Row>
      {story.sourcesSummary && <Row title="Sourced">{story.sourcesSummary}</Row>}
      {story.dietaryTags.length > 0 && <Row title="Suitable for">{story.dietaryTags.join(", ")}</Row>}
      {story.badges.length > 0 && <Row title="Certificates">Each one is listed under Certifications, with a link to the certificate.</Row>}
    </section>
  );
}
