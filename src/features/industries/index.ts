// Public surface of the industries feature. Other features import from here only.
export { ExtraFieldInputs } from "./components/ExtraFieldInputs";
export { getTemplate, industryIdSchema, industryOptions, isIndustryId, listTemplates } from "./registry";
export { calendarDaysBetween, extraFieldsSchema, freshnessLabel, hasOption, optionLabel, type BatchDates } from "./service";
export type { FieldDefinition, FreshnessRule, IndustryTemplate } from "./template.schema";
