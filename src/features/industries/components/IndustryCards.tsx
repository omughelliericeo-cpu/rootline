// "What do you make?" as photo cards (see choices.ts for which industries
// share a card).
//  - IndustryChoice: radio cards inside the sign-up form (works without JavaScript).
//  - IndustryLinks: the same cards as links into sign-up, for the home page.
// A shared card lists each of its industries as its own radio or link.
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
      <label className={`group block cursor-pointer hover:border-ink/40 ${CARD} ${CHECKED}`}>
        <CardPhoto id={choice.id} />
        <div className="p-4">
          <CardText name={choice.name} description={choice.description} trailing={<Radio name={name} value={only.id} />} />
        </div>
      </label>
    );
  }
  return (
    <fieldset className={`${CARD} ${CHECKED}`}>
      <CardPhoto id={choice.id} />
      <div className="flex flex-col gap-2 p-4">
        <legend className="contents">
          <CardText name={choice.name} description={choice.description} />
        </legend>
        {choice.templates.map((template) => (
          <label key={template.id} className="flex min-h-11 cursor-pointer items-start justify-between gap-3 rounded border border-line px-3 py-2 hover:border-ink/40 has-[:checked]:border-forest has-[:checked]:bg-sage-soft">
            <span>
              <span className="block text-sm font-medium">{template.name}</span>
              <span className="block text-xs text-muted">{template.description}</span>
            </span>
            <Radio name={name} value={template.id} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function IndustryChoice({ name = "industry", invalid }: { name?: string; invalid?: boolean }) {
  return (
    <fieldset aria-invalid={invalid || undefined}>
      <legend className="sr-only">What do you make?</legend>
      <div className="grid items-start gap-4 sm:grid-cols-2">
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
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <div className={`flex h-full flex-col ${CARD}`}>
                <CardPhoto id={choice.id} />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <CardText name={choice.name} description={choice.description} />
                  {/* Compact choices side by side, so this card stays the same height as the others. */}
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {choice.templates.map((template) => (
                      <Link key={template.id} href={signUpLink(template.id)} className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-line px-2.5 text-xs font-medium text-ink no-underline hover:border-forest hover:bg-sage-soft hover:text-forest">
                        {template.name}
                        <LineIcon name="arrow" className="h-3 w-3 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
