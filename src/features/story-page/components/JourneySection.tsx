// "The journey": the map beside the numbered stops, drawn as a timeline
// (stacked on phones). Tapping a stop opens its details (works without
// JavaScript). The suppliers are in their own section below.
import type { StopView } from "../journey";
import type { StoryView } from "../service";
import { RouteMap } from "./RouteMap";

function StopItem({ stop }: { stop: StopView }) {
  const line = [stop.name, stop.dateText].filter(Boolean).join(" · ");
  return (
    <details className="relative pb-4 pl-8">
      <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3">
        <span
          aria-hidden="true"
          className="absolute -left-3.5 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-semibold text-card ring-4 ring-cream"
        >
          {stop.number}
        </span>
        <span>
          <span className="block font-medium">{stop.typeLabel}</span>
          <span className="block text-sm text-muted">{line}</span>
        </span>
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {stop.address && (
          <>
            <dt className="text-muted">Where</dt>
            <dd>{stop.address}</dd>
          </>
        )}
        {stop.note && (
          <>
            <dt className="text-muted">Note</dt>
            <dd>{stop.note}</dd>
          </>
        )}
      </dl>
    </details>
  );
}

export function JourneySection({ story }: { story: StoryView }) {
  return (
    <section id="journey" className="flex scroll-mt-14 flex-col gap-4 px-5 py-8" aria-labelledby="journey-heading">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">Where it came from</p>
      <h2 id="journey-heading" className="text-2xl">
        From the source to the shelf
      </h2>
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <RouteMap points={story.mapPoints} label={`Map of the journey: ${story.sourcesSummary}, then ${story.stops.map((stop) => stop.name).join(", ")}`} />
        <div className="flex flex-col gap-3">
          <ol aria-label="Journey stops" className="ml-3.5 border-l border-sage pt-1">
            {story.stops.map((stop) => (
              <li key={stop.number}>
                <StopItem stop={stop} />
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted">Tap any stop for details. The suppliers and their lots are listed below.</p>
        </div>
      </div>
    </section>
  );
}
