// Smoke test: the app boots, pages render with the design system, and the
// health check answers. The two main journeys are added in later milestones.
import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every batch, traced");
});

test("health check reports the database", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.checks.database.status).toBe("ok");
  expect(body.requestId).toMatch(/^req_[a-f0-9]{12}$/);
});

test("every response carries a requestId", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-request-id"]).toMatch(/^req_[a-f0-9]{12}$/);
});
