// "What do you make?" as photo cards (see choices.ts for which industries
// share a card).
//  - IndustryChoice: radio cards inside the sign-up form (works without JavaScript).
//  - IndustryLinks: the same cards as links into sign-up, for the home page.
// A shared card (SharedCard) keeps its industries hidden over the photo until it is hovered, clicked or touched.
// Photos follow one naming rule (industryPhotoUrl): /photos/industries/{card id}.jpg.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LineIcon } from "@/ui/LineIcon";
import { industryChoices, type IndustryCardChoice } from "../choices";
import { industryPhotoUrl } from "../registry";

// Rounded with a soft shadow so the edges stand out; on hover the card lifts and its photo slowly zooms
// (motion only when the visitor allows it).
const CARD =
  "group/card overflow-hidden rounded-xl border border-line bg-card shadow-sm transition duration-300 hover:shadow-lg motion-safe:hover:-translate-y-1";

/** Every card photo the same 3:2 shape, so the cards line up (photos are saved at 3:2 where possible, so they show whole). */
function CardPhoto({ id }: { id: string }) {
  return (
    <div className="relative aspect-[3/2] overflow-hidden bg-line">
      <Image
        src={industryPhotoUrl(id)}
        alt=""
        fill
        sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 100vw"
        className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover/card:scale-105"
      />
    </div>
  );
}

function CardText({ name, description, trailing }: { name: string; description: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-serif text-lg leading-tight">{name}</p>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      {trailing}
    </div>
  );
}

function Radio({ name, value }: { name: string; value: string }) {
  return <input type="radio" name={name} value={value} required className="mt-1 h-5 w-5 shrink-0 accent-forest" />;
}

const CHECKED = "has-[:checked]:border-forest has-[:checked]:ring-1 has-[:checked]:ring-forest has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest";

function ChoiceCard({ choice, name }: { choice: IndustryCardChoice; name: string }) {
  const [only] = choice.templates;
  if (choice.templates.length === 1 && only) {
    return (
      <label className={`group block h-full cursor-pointer hover:border-ink/40 ${CARD} ${CHECKED}`}>
        <CardPhoto id={choice.id} />
        <div className="p-4">
          <CardText name={choice.name} description={choice.description} trailing={<Radio name={name} value={only.id} />} />
        </div>
      </label>
    );
  }
  return (
    <SharedCard choice={choice} as="fieldset" className={CHECKED}>
      {choice.templates.map((template) => (
        <label key={template.id} className={`cursor-pointer ${OPTION} has-[:checked]:bg-sage-soft has-[:checked]:ring-2 has-[:checked]:ring-forest`}>
          <span>{template.name}</span>
          <Radio name={name} value={template.id} />
        </label>
      ))}
    </SharedCard>
  );
}

const OPTION = "flex min-h-11 items-center justify-between gap-3 rounded-lg bg-card px-3 py-2 text-sm font-medium text-ink no-underline shadow-sm hover:bg-sage-soft";

// A shared card (Brewery & winery) is the same size as the others. Its choices sit over the photo and show when
// the card is hovered, clicked or touched (a <details>, so no JavaScript is needed), while one is focused, or once
// one is chosen. They are hidden with opacity, not display, so the browser can still focus them (for "required").
function SharedCard({ choice, as, className, children }: { choice: IndustryCardChoice; as: "fieldset" | "div"; className?: string; children: ReactNode }) {
  const Box = as;
  return (
    <Box className={`group/shared relative h-full ${CARD} ${className ?? ""}`}>
      {as === "fieldset" && <legend className="sr-only">{choice.name}</legend>}
      <details className="peer group/more h-full">
        <summary className="flex h-full cursor-pointer list-none flex-col [&::-webkit-details-marker]:hidden">
          <CardPhoto id={choice.id} />
          <div className="p-4">
            <CardText
              name={choice.name}
              description={choice.description}
              trailing={<LineIcon name="arrow" className="mt-1 h-4 w-4 shrink-0 rotate-90 text-ink transition-transform group-open/more:-rotate-90" />}
            />
          </div>
        </summary>
      </details>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[3/2] flex-col justify-center gap-2 bg-ink/55 p-4 opacity-0 transition-opacity group-hover/shared:pointer-events-auto group-hover/shared:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 has-[:checked]:pointer-events-auto has-[:checked]:opacity-100 peer-open:pointer-events-auto peer-open:opacity-100">
        {children}
      </div>
    </Box>
  );
}

export function IndustryChoice({ name = "industry", invalid }: { name?: string; invalid?: boolean }) {
  return (
    <fieldset aria-invalid={invalid || undefined}>
      <legend className="sr-only">What do you make?</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {industryChoices().map((choice) => (
          <ChoiceCard key={choice.id} choice={choice} name={name} />
        ))}
      </div>
    </fieldset>
  );
}

const signUpLink = (industryId: string) => `/signup?industry=${industryId}`;

export function IndustryLinks() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {industryChoices().map((choice) => {
        const [only] = choice.templates;
        return (
          <li key={choice.id} className="h-full">
            {choice.templates.length === 1 && only ? (
              <Link href={signUpLink(only.id)} className={`flex h-full flex-col text-ink no-underline hover:border-ink/40 ${CARD}`}>
                <CardPhoto id={choice.id} />
                <div className="p-4">
                  <CardText name={choice.name} description={choice.description} trailing={<LineIcon name="arrow" className="mt-1 h-4 w-4 shrink-0 text-ink" />} />
                </div>
              </Link>
            ) : (
              <SharedCard choice={choice} as="div">
                {choice.templates.map((template) => (
                  <Link key={template.id} href={signUpLink(template.id)} className={OPTION}>
                    {template.name}
                    <LineIcon name="arrow" className="h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </SharedCard>
            )}
          </li>
        );
      })}
    </ul>
  );
}
