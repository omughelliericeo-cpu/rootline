// Plans and billing: the public pricing page, Starter limits and upgrade
// notices, the Plan & billing page, and what Starter story pages leave out.
// Stripe is not configured in browser tests, so online payment shows as not set up.
import { expect, test } from "@playwright/test";
import {
  addLiveBatches,
  createTestProducer,
  deleteTestProducer,
  logIn,
  seedPublishedStory,
  setBatchStatus,
  type PublishedStory,
  type TestProducer,
} from "./support/producer";

test("the pricing page shows monthly and yearly prices, with or without JavaScript", async ({ page, browser }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Prove where it came from");
  await expect(page.getByText("$110", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Yearly/ }).click();
  await expect(page.getByText("$1,200", { exact: true })).toBeVisible();
  await expect(page.getByText("Save $120 a year")).toBeVisible();
  await expect(page.getByRole("table", { name: "Compare plans" }).getByText("Coming soon").first()).toBeVisible();
  await expect(page.getByText(/USDA/)).toHaveCount(0);

  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const plain = await noScript.newPage();
  await plain.goto("/pricing?billing=annual");
  await expect(plain.getByText("$400", { exact: true })).toBeVisible();
  await noScript.close();
});

test("the Stripe webhook refuses requests while Stripe is not set up", async ({ request }) => {
  expect((await request.post("/api/stripe/webhook", { data: "{}" })).status()).toBe(503);
});

test.describe("Starter plan", () => {
  let producer: TestProducer;
  let story: PublishedStory;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery", "STARTER");
    story = await seedPublishedStory(producer);
    // The story's batch is sold out and three others are live: the Starter limit.
    await setBatchStatus(story.batchId, "SOLD_OUT");
    await addLiveBatches(producer, 3);
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("limits live batches, locks Growth features and shows usage", async ({ page }) => {
    await logIn(page, producer);

    await page.goto(`/batches/${story.batchId}`);
    await page.getByRole("button", { name: "Back on sale" }).click();
    await expect(page.getByText(/The Starter plan allows 3 live batches/)).toBeVisible();

    await page.goto("/shelf-codes");
    await expect(page.getByRole("heading", { name: "Reusable shelf codes are part of Growth" })).toBeVisible();
    await expect(page.getByLabel("Where it goes")).toHaveCount(0);

    await page.goto("/billing");
    await expect(page.getByRole("heading", { level: 2, name: "Starter", exact: true })).toBeVisible();
    await expect(page.getByText("Current plan")).toBeVisible();
    await expect(page.getByText("3 of 3")).toBeVisible();
    await expect(page.getByText(/Online payment isn.t set up yet/).first()).toBeVisible();
  });

  test("story pages leave out recall sign-up and photo sharing, but keep sharing the story", async ({ page }) => {
    await page.goto(`/b/${story.batchCode}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Alert me if this batch is recalled" })).toHaveCount(0);
    await expect(page.getByText("Share your photo")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Share this story" })).toBeVisible();
  });
});
