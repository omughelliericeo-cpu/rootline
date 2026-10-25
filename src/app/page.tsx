// Home page for producers who land on Rootline directly (shoppers arrive on
// /b/{batchCode} from a QR code instead).
import { ButtonLink, PageShell } from "@/ui";

export default function HomePage() {
  return (
    <PageShell
      eyebrow="Rootline"
      title="Every batch, traced from source to shelf"
      description="Record where your product came from, print a QR code for each batch, and let shoppers see the farms, people and route behind it."
      width="narrow"
    >
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/signup">Create an account</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          Log in
        </ButtonLink>
      </div>
    </PageShell>
  );
}
