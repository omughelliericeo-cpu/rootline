// "Certifications": each verified claim with who issued it and a link to
// the certificate itself. Only claims backed by a valid certificate appear.
import { Badge } from "@/ui";
import type { StoryView } from "../service";

export function CertificationsSection({ story, code }: { story: StoryView; code: string }) {
  if (story.badges.length === 0) return null;
  return (
    <section id="certifications" className="flex scroll-mt-14 flex-col gap-4 border-t border-line px-5 py-8" aria-labelledby="certifications-heading">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">Checked, not claimed</p>
      <h2 id="certifications-heading" className="text-2xl">
        Certifications
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {story.badges.map((badge) => (
          <li key={badge.id} className="flex flex-col items-start gap-2 rounded border border-line bg-card p-4">
            <Badge tone="verified">{badge.label}</Badge>
            <p className="text-sm text-muted">Issued by {badge.issuer}</p>
            <a href={`/b/${code}/certificates/${badge.certificateId}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm">
              View the {badge.label} certificate
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
