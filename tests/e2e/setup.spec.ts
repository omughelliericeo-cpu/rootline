// An account that can log in but has no brand (e.g. its brand is in another
// database) is asked to finish setting up, instead of seeing an error page.
import { expect, test } from "@playwright/test";
import { createLoginWithoutBrand, deleteTestProducer, type TestProducer } from "./support/producer";

test.describe("finish setting up", () => {
  let producer: TestProducer;

  test.beforeAll(async () => {
    producer = await createLoginWithoutBrand();
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("a login without a brand creates one and reaches the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(producer.email);
    await page.getByLabel("Password").fill(producer.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await page.waitForURL(/\/setup$/);
    await expect(page.getByRole("heading", { name: "Finish setting up" })).toBeVisible();
    await page.getByRole("radio", { name: /Poultry & eggs/ }).check();
    await page.getByLabel("Business name").fill("Setup Test Farm");
    await page.getByLabel("Location").fill("Abbotsford, BC");
    await page.getByRole("button", { name: "Continue to my dashboard" }).click();

    await page.waitForURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Setup Test Farm");
    // Going back to /setup now goes straight to the dashboard.
    await page.goto("/setup");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
