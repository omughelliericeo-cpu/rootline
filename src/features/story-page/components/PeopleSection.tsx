// "The people behind your beer": portraits, names and roles, the maker's
// quote, and an optional video link (hosted on YouTube or Vimeo).
import Image from "next/image";
import type { StoryView } from "../service";

type PersonWithPhoto = StoryView["people"][number] & { photoUrl: string | null };

export function PeopleSection({ story, people }: { story: StoryView; people: PersonWithPhoto[] }) {
  if (people.length === 0 && !story.quote) return null;
  return (
    <section className="flex flex-col gap-6 border-t border-line px-5 py-8" aria-labelledby="people-heading">
      <h2 id="people-heading" className="text-2xl">
        {story.peopleHeading}
      </h2>
      {people.length > 0 && (
        <ul className="grid grid-cols-3 gap-4">
          {people.map((person) => (
            <li key={person.name} className="flex flex-col items-center gap-2 text-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-line">
                {person.photoUrl && <Image src={person.photoUrl} alt={`Portrait of ${person.name}`} fill sizes="80px" className="object-cover" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{person.name}</p>
                <p className="text-xs text-muted">{person.role}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {story.quote && (
        <figure className="flex flex-col gap-2">
          <blockquote className="font-serif text-xl leading-snug">“{story.quote.text}”</blockquote>
          {story.quote.by && <figcaption className="text-sm text-muted">— {story.quote.by}</figcaption>}
        </figure>
      )}
      {story.videoUrl && (
        <a href={story.videoUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 self-start text-sm">
          <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-current">
            <path d="M2 1l9 5-9 5z" />
          </svg>
          Watch the video
        </a>
      )}
    </section>
  );
}
