// The whole public story page, in a phone-width column. Server-rendered, so
// everything except the map works without JavaScript.
import { publicMediaUrl } from "@/lib/storage";
import type { StoryView } from "../service";
import { IngredientsSection } from "./IngredientsSection";
import { JourneySection } from "./JourneySection";
import { PeopleSection } from "./PeopleSection";
import { ShareButton } from "./ShareButton";
import { StoryIntro } from "./StoryIntro";

type StoryPageProps = { story: StoryView; code: string; url: string; logoPath: string | null };

export function StoryPage({ story, code, url, logoPath }: StoryPageProps) {
  const people = story.people.map((person) => ({ ...person, photoUrl: person.photoPath ? publicMediaUrl(person.photoPath) : null }));

  return (
    <main className="mx-auto w-full max-w-lg bg-cream sm:my-6 sm:rounded sm:border sm:border-line">
      <StoryIntro
        story={story}
        code={code}
        photoUrl={story.photoPath ? publicMediaUrl(story.photoPath) : null}
        logoUrl={logoPath ? publicMediaUrl(logoPath) : null}
      />
      <JourneySection story={story} />
      <IngredientsSection story={story} />
      <PeopleSection story={story} people={people} />
      <section className="flex flex-col gap-3 border-t border-line px-5 py-8">
        <ShareButton url={url} title={`${story.title} from ${story.brandName}`} />
      </section>
      <footer className="px-5 pb-8 text-center text-xs text-muted">Traced with Rootline · Verified claims only</footer>
    </main>
  );
}
