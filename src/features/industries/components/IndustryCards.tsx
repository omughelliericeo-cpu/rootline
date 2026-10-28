// "What do you make?" as photo cards (see choices.ts for which industries
// share a card).
//  - IndustryChoice: radio cards inside the sign-up form (works without JavaScript).
//  - IndustryLinks: full-photo tiles in a one-row carousel, linking into sign-up, for the home page.
// A shared card keeps its industries hidden until it is hovered, clicked or touched.
// Photos follow one naming rule (industryPhotoUrl): /photos/industries/{card id}.jpg.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LineIcon } from "@/ui/LineIcon";
import { industryChoices, type IndustryCardChoice } from "../choices";
import { industryPhotoUrl } from "../registry";
import { CarouselTrack } from "./CarouselTrack";

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
    <SharedCard choice={choice} className={CHECKED}>
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
function SharedCard({ choice, className, children }: { choice: IndustryCardChoice; className?: string; children: ReactNode }) {
  return (
    <fieldset className={`group/shared relative h-full ${CARD} ${className ?? ""}`}>
      <legend className="sr-only">{choice.name}</legend>
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
    </fieldset>
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

// Home page tiles: the photo fills the whole card, with the name over a dark fade. On hover the tile lifts,
// glows and its photo slowly zooms (motion only when the visitor allows it).
const TILE =
  "group/tile relative block aspect-[4/5] overflow-hidden rounded-2xl bg-forest text-card no-underline shadow-md ring-1 ring-ink/10 transition duration-300 hover:shadow-xl hover:ring-forest/40 motion-safe:hover:-translate-y-1.5";
const ITEM = "w-[78%] shrink-0 snap-start sm:w-[42%] lg:w-[calc((100%-3rem)/4)]";

function TileBackground({ id }: { id: string }) {
  return (
    <>
      <Image
        src={industryPhotoUrl(id)}
        alt=""
        fill
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 42vw, 78vw"
        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover/tile:scale-110"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/30 to-ink/0 transition-opacity duration-300 group-hover/tile:from-forest/95" />
    </>
  );
}

function TileText({ choice, cta }: { choice: IndustryCardChoice; cta: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
      <p className="font-serif text-2xl leading-tight text-card">{choice.name}</p>
      <p className="text-sm text-card/80">{choice.description}</p>
      <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-card">{cta}</span>
    </div>
  );
}

const MOVE_ARROW = "h-4 w-4 transition-transform duration-300 motion-safe:group-hover/tile:translate-x-1";

/** The home page's "Built for what you make": every category in one sliding row. */
export function IndustryLinks() {
  return (
    <CarouselTrack label="Categories">
      {industryChoices().map((choice) => {
        const [only] = choice.templates;
        return (
          <li key={choice.id} className={ITEM}>
            {choice.templates.length === 1 && only ? (
              <Link href={signUpLink(only.id)} className={TILE}>
                <TileBackground id={choice.id} />
                <TileText choice={choice} cta={<>Start here <LineIcon name="arrow" className={MOVE_ARROW} /></>} />
              </Link>
            ) : (
              // Shared card: hovering, focusing or tapping it (a <details>, no JavaScript needed) slides up its choices.
              <div className={`group/shared ${TILE}`}>
                <TileBackground id={choice.id} />
                <details className="peer absolute inset-0">
                  <summary className="absolute inset-0 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <TileText choice={choice} cta={<>Choose one <LineIcon name="arrow" className="h-4 w-4 rotate-90" /></>} />
                  </summary>
                </details>
                <div className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col gap-2 bg-forest p-5 opacity-0 transition duration-300 group-hover/shared:translate-y-0 group-hover/shared:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 peer-open:translate-y-0 peer-open:opacity-100">
                  <p className="font-serif text-xl text-card">{choice.name}</p>
                  {choice.templates.map((template) => (
                    <Link key={template.id} href={signUpLink(template.id)} className={OPTION}>
                      <span>
                        <span className="block">{template.name}</span>
                        <span className="block text-xs font-normal text-muted">{template.description}</span>
                      </span>
                      <LineIcon name="arrow" className="h-4 w-4 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </CarouselTrack>
  );
}
