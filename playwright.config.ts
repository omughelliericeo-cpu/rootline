// Playwright runs the end-to-end journeys in tests/e2e against a production
// build and the real database, on a phone-sized screen (shoppers and producers both
// mostly use phones).
import { defineConfig, devices } from "@playwright/test";

// Tests create their own users and rows, so they need the same settings as the app.
try {
  process.loadEnvFile(".env");
} catch {
  // CI provides real environment variables instead.
}

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // A production build, not `next dev`: dev mode recompiles and reloads
    // pages on first visit, which wipes forms the tests are filling in.
    command: `node scripts/e2e-server.mjs ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
