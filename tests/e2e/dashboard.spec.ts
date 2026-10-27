// Producer dashboard: after shoppers scan a story, the producer sees this
// week's scans, the batch in "Scans per batch" and "Recent", and New batch.
import { expect, test } from "@playwright/test";
import { createTestProducer, deleteTestProducer, logIn, scanCount, seedPublishedStory, type PublishedStory, type TestProducer } from "./support/producer";

test.describe("dashboard", () => {
  let producer: TestProducer;
  let story: PublishedStory;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
    story = await seedPublishedStory(producer);
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("shows scans, recall sign-ups, certificates and recent brews", async ({ page, request }) => {
    // Three shopper scans.
    for (let scan = 0; scan < 3; scan++) await request.get(`/b/${story.batchCode}`);
    await expect.poll(() => scanCount(story.batchId), { timeout: 10_000 }).toBe(3);

    await logIn(page, producer);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(new RegExp(`^Good (morning|afternoon|evening), ${producer.brandName}$`));

    const scans = page.locator("div", { has: page.getByRole("heading", { name: "Scans this week" }) }).last();
    await expect(scans.getByText("3", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recall alert sign-ups" })).toBeVisible();
    await expect(page.getByText("All certificates are in date for the next 30 days.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Hazy Pale Ale, Brew 214/ }).first()).toBeVisible();
    await expect(page.getByText(/· 3 scans$/)).toBeVisible();

    await page.getByRole("link", { name: "New brew" }).click();
    await expect(page).toHaveURL(/\/batches\/new$/);
  });
});
