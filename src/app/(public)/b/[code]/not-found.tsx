// Shown when a scanned code has no published batch (mistyped, or taken offline).
import { Card } from "@/ui";

export default function StoryNotFound() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16">
      <Card>
        <h1 className="mb-3 text-2xl">This story is not available</h1>
        <p className="text-muted">
          The code may be mistyped, or the maker has taken this batch offline. If you scanned it in a shop, please let
          them know.
        </p>
      </Card>
    </main>
  );
}
