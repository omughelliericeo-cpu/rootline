// "Where it came from": the map, then the sources and numbered stops as a
// list. Tapping an entry opens its details (works without JavaScript).
import type { SourceView, StopView } from "../journey";
import type { StoryView } from "../service";
import { RouteMap } from "./RouteMap";

function SourceItem({ source }: { source: SourceView }) {
  return (
    <details className="group border-b border-line py-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-brown" />
        <span>
          <span className="block font-medium">{source.supplies.join(", ")}</span>
          <span className="block text-sm text-muted">
            {source.name} · {source.typeLabel}
          </span>
        </span>
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pl-6 text-sm">
        <dt className="text-muted">{source.lotNumbers.length > 1 ? "Lots" : "Lot"}</dt>
        <dd>{source.lotNumbers.join(", ")}</dd>
        <dt className="text-muted">Where</dt>
        <dd>{source.address}</dd>
      </dl>
    </details>
  );
}

function StopItem({ stop }: { stop: StopView }) {
  const line = [stop.name, stop.dateText].filter(Boolean).join(" · ");
  return (
    <details className="border-b border-line py-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
        <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-forest text-xs font-semibold text-card">
          {stop.number}
        </span>
        <span>
          <span className="block font-medium">{stop.typeLabel}</span>
          <span className="block text-sm text-muted">{line}</span>
        </span>
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pl-10 text-sm">
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
    <section className="flex flex-col gap-4 border-t border-line px-5 py-8" aria-labelledby="journey-heading">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">Where it came from</p>
      <h2 id="journey-heading" className="text-2xl">
        From the source to the shelf
      </h2>
      <RouteMap points={story.mapPoints} label={`Map of the journey: ${story.sourcesSummary}, then ${story.stops.map((stop) => stop.name).join(", ")}`} />
      {story.sources.length > 0 && (
        <div>
          <h3 className="mt-2 font-sans text-sm font-medium text-muted">It started here</h3>
          {story.sources.map((source) => (
            <SourceItem key={source.supplierId} source={source} />
          ))}
        </div>
      )}
      <ol aria-label="Journey stops">
        {story.stops.map((stop) => (
          <li key={stop.number}>
            <StopItem stop={stop} />
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">Tap any stop or source for lot numbers and details.</p>
    </section>
  );
}
