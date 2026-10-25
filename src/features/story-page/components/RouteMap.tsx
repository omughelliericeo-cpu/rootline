"use client";
// The journey map. This is the ONLY file that uses Leaflet, so the map can be
// swapped (e.g. for Mapbox) by rewriting just this component.
// Leaflet loads after the page is shown, so it never delays the story text;
// without JavaScript the numbered stop list below the map tells the same story.
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "../journey";

// Design tokens (tailwind.config.mts); Leaflet needs plain colour values.
const FOREST = "#2F4A3A";
const BROWN = "#8A5A3B";

function markerHtml(point: MapPoint): string {
  // Labels are numbers we generate; names are added later as text, never as HTML.
  return point.kind === "stop"
    ? `<span class="rl-marker rl-marker-stop">${Number(point.label)}</span>`
    : `<span class="rl-marker rl-marker-source"></span>`;
}

type Bounds = Array<[number, number]>;

const toBounds = (list: MapPoint[]): Bounds => list.map((point) => [point.latitude, point.longitude]);

export function RouteMap({ points, label }: { points: MapPoint[]; label: string }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [showingAll, setShowingAll] = useState(false);
  const [ready, setReady] = useState(false);
  const stopPoints = points.filter((point) => point.kind === "stop");
  // Farms are often hours away; start on the local route so its stops do not overlap.
  const hasFarms = points.some((point) => point.kind === "source") && stopPoints.length > 0;

  function frame(all: boolean) {
    const target = all || stopPoints.length === 0 ? points : stopPoints;
    mapRef.current?.fitBounds(toBounds(target), { padding: [28, 28], maxZoom: 13 });
    setShowingAll(all);
  }

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !container.current || points.length === 0) return;
      map = L.map(container.current, { scrollWheelZoom: false });
      mapRef.current = map;
      map.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const stops = points.filter((point) => point.kind === "stop");
      const sources = points.filter((point) => point.kind === "source");
      const firstStop = stops[0];
      // Thin dashes from each farm or supplier to the first stop, then dots along the route.
      if (firstStop) {
        for (const source of sources) {
          L.polyline([[source.latitude, source.longitude], [firstStop.latitude, firstStop.longitude]], { color: BROWN, weight: 2, dashArray: "2 6" }).addTo(map);
        }
      }
      L.polyline(stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]), { color: FOREST, weight: 4, dashArray: "1 8", lineCap: "round" }).addTo(map);

      for (const point of points) {
        const popup = document.createElement("span");
        popup.textContent = point.name;
        L.marker([point.latitude, point.longitude], {
          title: point.name,
          icon: L.divIcon({ className: "", html: markerHtml(point), iconSize: [28, 28], iconAnchor: [14, 14] }),
        })
          .bindPopup(popup)
          .addTo(map);
      }
      const start = stops.length > 0 ? stops : points;
      map.fitBounds(L.latLngBounds(toBounds(start)), { padding: [28, 28], maxZoom: 13 });
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current = null;
      map?.remove();
    };
  }, [points]);

  if (points.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div ref={container} role="img" aria-label={label} className="rl-map h-72 w-full overflow-hidden rounded border border-line bg-line/40 sm:h-80">
        <noscript>
          {/* Without JavaScript there is no map; shrink the box to just this note. */}
          <style>{".rl-map{height:auto}"}</style>
          <p className="p-4 text-sm text-muted">The map needs JavaScript. Every stop is listed below.</p>
        </noscript>
      </div>
      {ready && hasFarms && (
        <button type="button" onClick={() => frame(!showingAll)} className="inline-flex min-h-11 items-center self-start text-sm text-brown underline underline-offset-3">
          {showingAll ? "Back to the route" : "Show the farms too"}
        </button>
      )}
    </div>
  );
}
