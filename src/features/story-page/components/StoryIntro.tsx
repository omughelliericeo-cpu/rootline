// Top of the story page, laid out like the owner's style template: a wide
// photo banner, then the brand, the batch name, the headline, the freshness
// line and the verified badges (each opens its certificate). Without a photo
// of their own, the industry's general photo is shown as a decorative banner.
import Image from "next/image";
import { Badge } from "@/ui";
import type { StoryView } from "../service";

type StoryIntroProps = { story: StoryView; code: string; photoUrl: string | null; logoUrl: string | null };

export function StoryIntro({ story, code, photoUrl, logoUrl }: StoryIntroProps) {
  return (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-line sm:rounded-t md:aspect-[16/6]">
        <Image
          src={photoUrl ?? story.fallbackPhotoUrl}
          // The general photo is not of this batch, so it is decorative only.
          alt={photoUrl ? story.photoAlt : ""}
          fill
          priority
          sizes="(min-width: 768px) 48rem, 100vw"
          className="object-cover"
        />
      </div>

      <section className="flex flex-col gap-4 px-5 pt-6 pb-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {logoUrl && <Image src={logoUrl} alt="" width={32} height={32} className="h-8 w-8 rounded object-contain" />}
            <p className="font-serif text-xl">{story.brandName}</p>
          </div>
          <p className="text-sm text-muted">{story.brandLocation}</p>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">{story.eyebrow}</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">{story.headline}</h1>
        {story.freshness && (
          <p className="self-start rounded-full border border-line bg-card px-4 py-1.5 text-sm font-medium">{story.freshness}</p>
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
