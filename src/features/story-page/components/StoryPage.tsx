// The whole public story page, in a phone-width column. Server-rendered, so
// everything except the map works without JavaScript.
import { RecallNotice, RecallSignupForm } from "@/features/recalls";
import { ShopperPhotosSection } from "@/features/shopper-photos";
import { publicMediaUrl } from "@/lib/storage";
import type { StoryView } from "../service";
import { CertificationsSection } from "./CertificationsSection";
import { IngredientsSection } from "./IngredientsSection";
import { JourneySection } from "./JourneySection";
import { PeopleSection } from "./PeopleSection";
import { ShareButton } from "./ShareButton";
import { StoryIntro } from "./StoryIntro";
import { StoryTabs } from "./StoryTabs";
import { SuppliersSection } from "./SuppliersSection";

type StoryPageProps = { story: StoryView; code: string; url: string; logoPath: string | null };

export function StoryPage({ story, code, url, logoPath }: StoryPageProps) {
  const people = story.people.map((person) => ({ ...person, photoUrl: person.photoPath ? publicMediaUrl(person.photoPath) : null }));

  return (
    <main className="mx-auto w-full max-w-lg bg-cream sm:my-6 sm:rounded sm:border sm:border-line md:max-w-3xl">
      <RecallNotice recalls={story.recalls} timeZone={story.timeZone} />
      <StoryIntro
        story={story}
        code={code}
        photoUrl={story.photoPath ? publicMediaUrl(story.photoPath) : null}
        logoUrl={logoPath ? publicMediaUrl(logoPath) : null}
      />
      <StoryTabs hasCertifications={story.badges.length > 0} hasRecallAlerts={story.offers.recallEmails} />
      <JourneySection story={story} />
      <SuppliersSection story={story} />
      <IngredientsSection story={story} />
      <CertificationsSection story={story} code={code} />
      <PeopleSection story={story} people={people} />
      <ShopperPhotosSection
        photos={story.shopperPhotos.map((photo) => ({ ...photo, url: publicMediaUrl(photo.photoPath) }))}
        batchCode={code}
        brandName={story.brandName}
        acceptsPhotos={story.offers.shopperPhotos}
      />
      {story.offers.recallEmails ? (
        <section id="recall-alerts" className="flex scroll-mt-14 flex-col gap-3 border-t border-line px-5 py-8" aria-labelledby="recall-alerts-heading">
          <h2 id="recall-alerts-heading" className="text-2xl">
            Recall alerts
          </h2>
          <p className="text-sm text-muted">We&rsquo;ll only email you if this batch is ever recalled.</p>
          <div className="md:max-w-md">
            <RecallSignupForm batchCode={code} />
          </div>
          <ShareButton url={url} title={`${story.title} from ${story.brandName}`} />
        </section>
      ) : (
        <section className="border-t border-line px-5 py-8" aria-label="Share this story">
          <ShareButton url={url} title={`${story.title} from ${story.brandName}`} />
        </section>
      )}
      <footer className="px-5 pb-8 text-center text-xs text-muted">Traced with Rootline · Verified claims only</footer>
    </main>
  );
}
