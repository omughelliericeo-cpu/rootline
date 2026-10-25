// Top of the story page: brand bar, hero photo, batch name, headline,
// freshness line and verified badges (each opens its certificate).
import Image from "next/image";
import { Badge } from "@/ui";
import type { StoryView } from "../service";

type StoryIntroProps = { story: StoryView; code: string; photoUrl: string | null; logoUrl: string | null };

export function StoryIntro({ story, code, photoUrl, logoUrl }: StoryIntroProps) {
  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          {logoUrl && <Image src={logoUrl} alt="" width={28} height={28} className="h-7 w-7 rounded object-contain" />}
          <p className="font-serif text-lg">{story.brandName}</p>
        </div>
        <p className="text-sm text-muted">{story.brandLocation}</p>
      </header>

      {photoUrl && (
        <div className="relative aspect-[4/3] w-full bg-line">
          <Image src={photoUrl} alt={story.photoAlt} fill priority sizes="(min-width: 640px) 32rem, 100vw" className="object-cover" />
        </div>
      )}

      <section className="flex flex-col gap-4 px-5 pt-6 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">{story.eyebrow}</p>
        <h1 className="text-3xl leading-tight">{story.headline}</h1>
        {story.freshness && (
          <p className="self-start rounded border border-line bg-card px-3 py-2 text-sm font-medium">{story.freshness}</p>
        )}
        {story.soldOut && (
          <p className="text-sm text-muted">This batch has sold out. Its story stays here for anyone holding one.</p>
        )}
        {story.badges.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Verified claims">
            {story.badges.map((badge) => (
              <li key={badge.id}>
                <a
                  href={`/b/${code}/certificates/${badge.certificateId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center no-underline"
                  aria-label={`${badge.label}: verified, view the certificate`}
                >
                  <Badge tone="verified">{badge.label}</Badge>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
