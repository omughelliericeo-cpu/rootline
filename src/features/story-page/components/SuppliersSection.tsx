// "Suppliers": the farms and suppliers whose lots went in. Tapping one opens
// its lot numbers, address and photo (works without JavaScript).
import Image from "next/image";
import { publicMediaUrl } from "@/lib/storage";
import type { SourceView } from "../journey";
import type { StoryView } from "../service";

function SourceItem({ source }: { source: SourceView }) {
  return (
    <details className="group border-b border-line py-3 last:border-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-brown" />
        <span>
          <span className="block font-medium">{source.supplies.join(", ")}</span>
          <span className="block text-sm text-muted">
            {source.name} · {source.typeLabel}
          </span>
        </span>
      </summary>
      {source.photoPath && (
        <div className="relative mt-3 ml-6 aspect-[4/3] overflow-hidden rounded bg-line md:max-w-md">
          {/* Only loaded once the shopper opens this source, so it never slows the page. */}
          <Image src={publicMediaUrl(source.photoPath)} alt={`${source.name}, ${source.address}`} fill sizes="(min-width: 640px) 28rem, 90vw" className="object-cover" />
        </div>
      )}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pl-6 text-sm">
        <dt className="text-muted">{source.lotNumbers.length > 1 ? "Lots" : "Lot"}</dt>
        <dd>{source.lotNumbers.join(", ")}</dd>
        <dt className="text-muted">Where</dt>
        <dd>{source.address}</dd>
      </dl>
    </details>
  );
}

export function SuppliersSection({ story }: { story: StoryView }) {
  if (story.sources.length === 0) return null;
  return (
    <section id="suppliers" className="flex scroll-mt-14 flex-col gap-3 border-t border-line px-5 py-8" aria-labelledby="suppliers-heading">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">It started here</p>
      <h2 id="suppliers-heading" className="text-2xl">
        Suppliers
      </h2>
      <div className="rounded border border-line bg-card px-4">
        {story.sources.map((source) => (
          <SourceItem key={source.supplierId} source={source} />
        ))}
      </div>
    </section>
  );
}
