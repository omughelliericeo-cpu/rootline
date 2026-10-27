// The list of industry templates. To add an industry:
//   1. create templates/<id>.ts (copy an existing one),
//   2. add it to the list below.
// tests/templates.test.ts fails if a template file exists but is not listed,
// or if any template does not pass template.schema.ts.
import { bakery } from "./bakery";
import { brewery } from "./brewery";
import { coffee } from "./coffee";
import { poultry } from "./poultry";
import { produce } from "./produce";
import { winery } from "./winery";

/** Order here is the order of the "What do you make?" dropdown. */
export const TEMPLATE_FILES = [brewery, bakery, poultry, produce, coffee, winery];
