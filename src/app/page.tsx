// Home page for producers who land on Rootline directly (shoppers arrive on
// /b/{batchCode} from a QR code instead): what Rootline does, the industries
// it is set up for (each card starts sign-up with that industry chosen), and
// links to sign up or log in. Photos live in /public/photos (see its README).
import Image from "next/image";
import Link from "next/link";
import { IndustryLinks } from "@/features/industries";
import { ButtonLink, LineIcon, SiteHeader, type LineIconName } from "@/ui";
import heroPhoto from "../../public/photos/home/hero-produce.jpg";

const PROMISES: Array<{ icon: LineIconName; title: string; text: string; label: string; fact: string }> = [
  {
    icon: "leaf",
    title: "Full traceability",
    text: "Every batch records the supplier lots that went in and each stop on its way to the shelf, shown on a map.",
    label: "For every batch",
    fact: "Lots and route, on a map",
  },
  {
    icon: "shield",
    title: "Build trust",
    text: "Badges like Organic or B Corp only appear while a current certificate is on file, and shoppers can open it.",
    label: "Badges shown",
    fact: "Only with a valid certificate",
  },
  {
    icon: "document",
    title: "Meet compliance",
    text: "Inspectors and retailers get the product, dates, lot numbers and full route for any batch.",
    label: "Export",
    fact: "PDF or CSV in one click",
  },
  {
    icon: "people",
    title: "Stronger communities",
    text: "Your growers and suppliers are named on every story page, so shoppers know who to thank.",
    label: "On every story page",
    fact: "Your growers, by name",
  },
];

/**
 * One promise card: compact (icon, title, "+"). Hovering, or tapping it on a
 * phone, reveals the details and turns it forest green; moving away or
 * tapping elsewhere returns it to the compact look. Pure CSS (hover and
 * focus), so it works without JavaScript. The open card floats over the
 * content below, so the page does not jump. The details stay in the page for
 * screen readers, only visually folded away.
 */
function PromiseCard({ promise }: { promise: (typeof PROMISES)[number] }) {
  return (
    <li className="relative h-[5.5rem]">
      <div
        tabIndex={0}
        className="group absolute inset-x-0 top-0 z-0 flex min-h-full cursor-pointer flex-col justify-center rounded-xl border border-line bg-card p-5 shadow-sm outline-none transition-all duration-300 hover:z-20 hover:border-forest hover:bg-forest hover:shadow-xl focus:z-20 focus:border-forest focus:bg-forest focus:shadow-xl focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-sand text-forest transition-colors group-hover:border-card/15 group-hover:bg-card/10 group-hover:text-sage-soft group-focus:border-card/15 group-focus:bg-card/10 group-focus:text-sage-soft">
            <LineIcon name={promise.icon} className="h-5 w-5" />
          </span>
          <h3 className="flex-1 font-sans text-base font-semibold leading-snug transition-colors group-hover:text-card group-focus:text-card">{promise.title}</h3>
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-sm text-forest transition-transform duration-300 group-hover:rotate-45 group-hover:border-card/30 group-hover:text-card group-focus:rotate-45 group-focus:border-card/30 group-focus:text-card">
            +
          </span>
        </span>
        <span className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus:grid-rows-[1fr] group-focus:opacity-100">
          <span className="overflow-hidden">
            <span className="block pt-3 text-sm text-card/80">{promise.text}</span>
            <span className="mt-3 flex items-end justify-between gap-3 border-t border-card/15 pt-3">
              <span>
                <span className="block text-[11px] font-medium uppercase tracking-[0.1em] text-sage">{promise.label}</span>
                <span className="block font-semibold text-card">{promise.fact}</span>
              </span>
              <span aria-hidden="true" className="mb-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sage" />
            </span>
          </span>
        </span>
      </div>
    </li>
  );
}

/** Floating labels over the hero picture, in the style of the owner's reference. Decorative examples, not real data. */
function HeroLabels() {
  return (
    <div aria-hidden="true">
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded border border-card/60 bg-card/85 px-2 py-1.5 shadow-sm sm:gap-3 sm:px-3 sm:py-2 backdrop-blur-sm motion-safe:animate-[rl-float_6s_ease-in-out_infinite] sm:left-5 sm:top-5">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-sand text-[10px] font-semibold text-brown sm:h-9 sm:w-9 sm:text-xs">QR</span>
        <span>
          <span className="block text-sm font-semibold text-ink">Brew 214</span>
          <span className="hidden text-xs text-muted sm:block">Scan to see its journey</span>
        </span>
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded bg-forest px-3 py-1.5 text-card shadow-sm sm:gap-3 sm:px-4 sm:py-2.5 motion-safe:animate-[rl-float_6s_ease-in-out_3s_infinite] sm:bottom-5 sm:right-5">
        <span className="h-2.5 w-2.5 rounded-full bg-sage" />
        <span>
          <span className="block text-sm font-semibold">Verified claims only</span>
          <span className="hidden text-xs text-card/75 sm:block">Backed by a current certificate</span>
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-svh bg-cream">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-4 sm:px-8 md:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] md:pb-16">
          <div className="flex flex-col gap-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink">Traceability for a healthier tomorrow</p>
            <h1 className="text-5xl leading-[1.05] sm:text-6xl">Real food has a real journey.</h1>
            <p className="max-w-md text-lg text-muted">
              Rootline gives producers the tools to track and share every batch, from farm to shelf.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <ButtonLink href="/signup">
                Get started <LineIcon name="arrow" className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="#how-it-helps" variant="secondary">
                Learn more
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            <Image
              src={heroPhoto}
              alt="Fruit, coffee, dairy, fish, meat, poultry and bread on a wooden table, each linked to a QR code"
              priority
              sizes="(min-width: 1152px) 680px, (min-width: 768px) 60vw, 100vw"
              className="h-auto w-full rounded"
            />
            <HeroLabels />
          </div>
        </section>

        <section id="how-it-helps" aria-labelledby="promises-heading" className="mx-auto max-w-6xl px-4 py-4 sm:px-8">
          <h2 id="promises-heading" className="sr-only">
            What Rootline does
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((promise) => (
              <PromiseCard key={promise.title} promise={promise} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="industries-heading" className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-8">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink">Built for what you make</p>
            <h2 id="industries-heading" className="text-4xl">
              Fresh. Local. Traceable.
            </h2>
            <p className="max-w-xl text-muted">
              From craft beer to fresh eggs, Rootline helps you share the story behind every batch. Pick yours to start.
            </p>
          </div>
          <IndustryLinks />
        </section>

        <section aria-label="Our promise" className="bg-forest">
          <figure className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-14 text-card sm:px-8">
            <blockquote className="font-serif text-3xl leading-snug sm:text-4xl">
              &ldquo;Transparency isn&rsquo;t a feature.
              <br />
              It&rsquo;s a promise.&rdquo;
            </blockquote>
            <figcaption className="text-sm text-card/80">— The Rootline team</figcaption>
          </figure>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-8">
        <span>Rootline · Every batch, traced from source to shelf</span>
        <span className="flex gap-4">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </span>
      </footer>
    </div>
  );
}
