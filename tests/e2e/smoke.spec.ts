// Smoke test: the app boots, pages render with the design system, and the
// health check answers. The two main journeys are added in later milestones.
import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Real food has a real journey");
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

test("the home page lists every category in one row, without Bakery", async ({ page }) => {
  await page.goto("/");
  const row = page.getByRole("list", { name: "Categories" });
  await expect(row.getByRole("listitem")).toHaveCount(6);
  await expect(row.getByText("Cosmetics & skincare")).toBeVisible();
  await expect(row.getByText("Bakery")).toHaveCount(0);

  // The shared card shows its two choices when tapped.
  await row.getByText("Brewery & winery").first().click();
  await row.getByRole("link", { name: /Winery/ }).click();
  await expect(page).toHaveURL(/\/signup\?industry=winery/);
});
