"use client";
// A one-row carousel: the cards scroll sideways (swipe, trackpad or the arrow
// buttons) and snap into place. Without JavaScript it is still a scrollable row;
// the arrows only add a page-at-a-time jump.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LineIcon } from "@/ui/LineIcon";
import { cx } from "@/ui/cx";

const ARROW =
  "flex h-11 w-11 items-center justify-center rounded-full border border-forest/20 bg-card text-forest shadow-sm transition hover:bg-forest hover:text-card disabled:pointer-events-none disabled:opacity-35";

export function CarouselTrack({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const page = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <button type="button" className={ARROW} onClick={() => page(-1)} disabled={edges.start} aria-label="Previous categories">
          <LineIcon name="arrow" className="h-4 w-4 rotate-180" />
        </button>
        <button type="button" className={ARROW} onClick={() => page(1)} disabled={edges.end} aria-label="More categories">
          <LineIcon name="arrow" className="h-4 w-4" />
        </button>
      </div>
      <ul
        ref={track}
        onScroll={update}
        aria-label={label}
        tabIndex={0}
        className={cx(
          "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-6 pt-2 sm:-mx-8 sm:px-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-forest",
        )}
      >
        {children}
      </ul>
    </div>
  );
}
