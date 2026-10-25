// Looks up templates by industry id. Templates are validated once, when this
// module loads, so a broken template file fails immediately and loudly.
import { z } from "zod";
import { templateSchema, type IndustryTemplate } from "./template.schema";
import { TEMPLATE_FILES } from "./templates";

const TEMPLATES: ReadonlyMap<string, IndustryTemplate> = new Map(
  TEMPLATE_FILES.map((file) => {
    const template = templateSchema.parse(file);
    return [template.id, template];
  }),
);

export function listTemplates(): IndustryTemplate[] {
  return [...TEMPLATES.values()];
}

export function isIndustryId(value: string): boolean {
  return TEMPLATES.has(value);
}

/**
 * The template for a brand's industry. Brand.industry is only ever written
 * after validation with industryIdSchema, so a miss means a template was
 * removed while brands still use it: a deployment bug worth crashing on.
 */
export function getTemplate(industryId: string): IndustryTemplate {
  const template = TEMPLATES.get(industryId);
  if (!template) throw new Error(`No industry template with id "${industryId}"`);
  return template;
}

/** Options for the "What do you make?" dropdown. */
export function industryOptions(): Array<{ value: string; label: string }> {
  return listTemplates().map((template) => ({ value: template.id, label: template.name }));
}

export const industryIdSchema = z.string().refine(isIndustryId, "Choose what you make from the list");
