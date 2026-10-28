// Thin line icons for marketing pages (no icon library). Decorative only:
// the text next to each icon says what it means.

const PATHS = {
  leaf: ["M5 27C5 14 13 6 27 5c-1 14-9 22-22 22z", "M5 27L18 14"],
  shield: ["M16 3l10 4v8c0 7-4 11-10 14C10 26 6 22 6 15V7z", "M11 16l4 4 7-8"],
  document: ["M8 3h11l6 6v20H8z", "M19 3v6h6", "M12 15h9", "M12 20h9", "M12 25h6"],
  people: [
    "M11 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M3 27c0-5 3.5-8 8-8s8 3 8 8z",
    "M19 19.3c.9-.2 1.9-.3 3-.3 4.5 0 7 3 7 8h-8",
  ],
  user: ["M16 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M5 29c0-6 5-10 11-10s11 4 11 10z"],
  arrow: ["M5 16h22", "M19 8l8 8-8 8"],
  chevron: ["M12 7l9 9-9 9"],
  search: ["M14 24a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M21.5 21.5L28 28"],
  menu: ["M5 9h22", "M5 16h22", "M5 23h22"],
  grid: ["M5 5h9v9H5z", "M18 5h9v9h-9z", "M5 18h9v9H5z", "M18 18h9v9h-9z"],
  box: ["M16 3l12 6v14l-12 6-12-6V9z", "M4 9l12 6 12-6", "M16 15v14"],
  tag: ["M4 4h11l13 13-11 11L4 15z", "M10 10h.01"],
  truck: ["M3 8h15v14H3z", "M18 13h6l5 5v4H18", "M9 26a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M23 26a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  award: ["M16 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M11 17l-3 12 8-4 8 4-3-12"],
  qr: ["M4 4h9v9H4z", "M19 4h9v9h-9z", "M4 19h9v9H4z", "M19 19h4v4h-4z", "M25 25h3v3h-3z", "M8 8h1", "M23 8h1", "M8 23h1"],
  store: ["M4 12l2-7h20l2 7", "M4 12h24v3a4 4 0 0 1-8 0 4 4 0 0 1-8 0 4 4 0 0 1-8 0z", "M6 18v10h20V18", "M13 28v-6h6v6"],
  camera: ["M4 10h6l2-4h8l2 4h6v16H4z", "M16 22a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"],
  logout: ["M13 5H5v22h8", "M20 10l6 6-6 6", "M26 16H12"],
} as const;

export type LineIconName = keyof typeof PATHS;

export function LineIcon({ name, className }: { name: LineIconName; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
