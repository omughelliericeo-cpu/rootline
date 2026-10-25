// Starts the server Playwright tests run against: a production build, so
// tests are not disturbed by dev-mode recompiles and reloads. It builds into
// its own folder (.next-e2e) so it never clashes with a running `npm run dev`.
//   node scripts/e2e-server.mjs 3100
import { spawnSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";

const port = process.argv[2] ?? "3100";
// GEOCODER_URL: tests must not send lookups to OpenStreetMap's public service,
// so address search points at a port with nothing listening and fails fast.
const env = { ...process.env, NEXT_DIST_DIR: ".next-e2e", GEOCODER_URL: "http://127.0.0.1:9/search" };
// shell: true lets "npx" resolve on Windows as well as macOS/Linux.
const options = { stdio: "inherit", env, shell: true };

// Always a clean build: a stale build cache once crashed Turbopack
// ("generate_source_map was canceled") and tests should be reproducible.
rmSync(".next-e2e", { recursive: true, force: true });
const build = spawnSync("npx next build", options);
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn(`npx next start --port ${port}`, options);
server.on("exit", (code) => process.exit(code ?? 0));
