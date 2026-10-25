// Shown for unknown URLs and whenever server code calls notFound().
import { ButtonLink, Card } from "@/ui";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <Card>
        <h1 className="mb-3 text-2xl">Page not found</h1>
        <p className="mb-6 text-muted">
          This link may be mistyped, or the batch it points to is no longer published.
        </p>
        <ButtonLink href="/" variant="secondary">
          Go to the home page
        </ButtonLink>
      </Card>
    </main>
  );
}
