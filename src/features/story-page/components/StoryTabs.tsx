// The tab row under the story intro: plain links to sections further down
// the page, so it needs no JavaScript. Stays at the top while scrolling.
const TABS = [
  { href: "#journey", label: "The journey" },
  { href: "#suppliers", label: "Suppliers" },
  { href: "#certifications", label: "Certifications" },
  { href: "#recall-alerts", label: "Recall alerts" },
];

export function StoryTabs({ hasCertifications, hasRecallAlerts }: { hasCertifications: boolean; hasRecallAlerts: boolean }) {
  const tabs = TABS.filter((tab) => (tab.href !== "#certifications" || hasCertifications) && (tab.href !== "#recall-alerts" || hasRecallAlerts));
  return (
    <nav aria-label="Story sections" className="sticky top-0 z-10 overflow-x-auto border-y border-line bg-cream px-3">
      <ul className="flex gap-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <a href={tab.href} className="inline-flex min-h-12 items-center whitespace-nowrap border-b-2 border-transparent px-3 text-sm text-muted no-underline hover:border-forest hover:text-forest">
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
