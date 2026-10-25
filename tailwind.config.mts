// Rootline design tokens, defined once. Every colour, font and corner radius
// in the UI comes from here; components never use raw hex values.
// Loaded by src/app/globals.css via `@config`. (.mts so Node treats it as an ES module.)
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        cream: "#F6F1E7", // page background
        ink: "#2B2A26", // main text
        forest: "#2F4A3A", // primary actions, verified badges
        brown: "#8A5A3B", // accents, links
        muted: "#6E685D", // secondary text
        line: "#DDD4C3", // borders and dividers
        card: "#FFFDF8", // card surfaces
        danger: "#8B2A1E", // errors and destructive actions (not in the Figma palette; see DECISIONS)
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px", // square-ish corners everywhere
      },
    },
  },
} satisfies Config;
