// "Search batches..." above a list. A plain GET form (?q=...), so it works
// without JavaScript; the page filters by the query.
import { LineIcon } from "./LineIcon";

export function SearchBox({ label, query, action }: { label: string; query?: string; action: string }) {
  return (
    <form method="get" action={action} role="search" className="relative flex-1">
      <label htmlFor="list-search" className="sr-only">
        {label}
      </label>
      <LineIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        id="list-search"
        name="q"
        type="search"
        defaultValue={query}
        placeholder={`${label}…`}
        className="min-h-11 w-full rounded border border-line bg-card pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none"
      />
    </form>
  );
}

/** Case-insensitive "does any of these texts contain the query?" */
export function matchesQuery(query: string | undefined, ...texts: Array<string | null | undefined>): boolean {
  const needle = query?.trim().toLowerCase();
  if (!needle) return true;
  return texts.some((text) => text?.toLowerCase().includes(needle));
}

/** The ?q= value from a page's searchParams. */
export function queryParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value.slice(0, 100) : undefined;
}
