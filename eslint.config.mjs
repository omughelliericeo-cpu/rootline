// Lint rules. Besides the Next.js defaults, this enforces the folder rules
// from docs/ARCHITECTURE.md:
//  - other code may use a feature only through its index.ts
//    ("@/features/batches", never "@/features/batches/service")
//  - only feature server/ folders and src/lib may touch the database.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const featureDeepImport = {
  group: ["@/features/*/*"],
  message: "Import another feature through its index.ts (e.g. '@/features/batches'). Inside a feature, use relative imports.",
};

const databaseImport = {
  group: ["@/lib/db", "@/generated/prisma", "@/generated/prisma/*"],
  message: "Only a feature's server/ folder may access the database.",
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", ".next-e2e/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**", "playwright-report/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [featureDeepImport, databaseImport] }],
    },
  },
  {
    // Server folders and shared lib code may use the database.
    files: ["src/features/*/server/**/*.{ts,tsx}", "src/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [featureDeepImport] }],
    },
  },
]);
