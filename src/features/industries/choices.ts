// How industries are offered on "What do you make?" (sign-up and home):
// most as a card of their own, a few side by side in one shared card. The
// owner asked for brewery and winery to share a card. Each stays its own
// template with its own words (a "Brew" that is canned vs a "Bottling").
import { getTemplate, listTemplates } from "./registry";
import type { IndustryTemplate } from "./template.schema";

type Group = { id: string; name: string; description: string; members: string[] };

const GROUPS: Group[] = [
  { id: "drinks", name: "Brewery & winery", description: "Beer, cider, kombucha and wine.", members: ["brewery", "winery"] },
];

export type IndustryCardChoice = {
  /** A template id, or a group id for a shared card. Also the photo name (industryPhotoUrl). */
  id: string;
  name: string;
  description: string;
  /** One template for a card of its own; several for a shared card. */
  templates: IndustryTemplate[];
};

/** Every template exactly once, in registry order; a group appears where its first member would. */
export function industryChoices(): IndustryCardChoice[] {
  const placed = new Set<string>();
  const choices: IndustryCardChoice[] = [];
  for (const template of listTemplates()) {
    if (placed.has(template.id)) continue;
    const group = GROUPS.find((candidate) => candidate.members.includes(template.id));
    const templates = group ? group.members.map(getTemplate) : [template];
    templates.forEach((member) => placed.add(member.id));
    choices.push(group ? { id: group.id, name: group.name, description: group.description, templates } : { id: template.id, name: template.name, description: template.description, templates });
  }
  return choices;
}
