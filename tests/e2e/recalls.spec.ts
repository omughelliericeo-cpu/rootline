// Recall alerts: a shopper signs up on the story page, the producer sends a
// recall (email is only logged in tests), the story page warns every visitor,
// and the email's unsubscribe link works.
import { expect, test } from "@playwright/test";
import {
  createTestProducer,
  deleteTestProducer,
  logIn,
  recallSubscriber,
  seedPublishedStory,
  type PublishedStory,
  type TestProducer,
} from "./support/producer";

const SHOPPER = "e2e-shopper@rootline.test";

test.describe("recall alerts", () => {
  let producer: TestProducer;
  let story: PublishedStory;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
    story = await seedPublishedStory(producer);
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("sign up, send a recall, warn shoppers, unsubscribe", async ({ page, browser, request }) => {
    // 1. A shopper signs up from the story page (no account).
    const shopper = await browser.newPage();
    await shopper.goto(`/b/${story.batchCode}`);
    await shopper.getByLabel("Email for recall alerts").fill(SHOPPER);
    await shopper.getByLabel(/Email me only if this batch is recalled/).check();
    await shopper.getByRole("button", { name: "Alert me if this batch is recalled" }).click();
    await expect(shopper.getByText("You're on the list.")).toBeVisible();
    expect(await recallSubscriber(story.batchId, SHOPPER)).toMatchObject({ unsubscribed: false });

    // 2. The producer sees the sign-up and sends a recall.
    page.on("dialog", (dialog) => dialog.accept());
    await logIn(page, producer);
    await page.goto(`/batches/${story.batchId}`);
    await expect(page.getByText("1 person signed up for alerts")).toBeVisible();
    await page.getByRole("link", { name: "Send a recall or see past recalls" }).click();
    await page.getByLabel("What is wrong").fill("Possible glass in some cans");
    await page.getByLabel("Message").fill("Please do not drink it. Return it to the store for a full refund.");
    await page.getByLabel("I want to email everyone signed up for this batch now.").check();
    await page.getByRole("button", { name: "Send recall" }).click();
    await expect(page.getByText("Recall sent to 1 person. It also shows on the story page.")).toBeVisible();
    await expect(page.getByText(/· sent to 1$/)).toBeVisible();

    // 3. Everyone who opens the story now sees the warning first.
    await shopper.goto(`/b/${story.batchCode}`);
    await expect(shopper.getByRole("alert").getByText("Recall notice")).toBeVisible();
    await expect(shopper.getByRole("heading", { name: "Possible glass in some cans" })).toBeVisible();

    // 4. The unsubscribe link from the email works (opening it alone changes nothing).
    const subscriber = await recallSubscriber(story.batchId, SHOPPER);
    await shopper.goto(`/recall/unsubscribe/${subscriber!.token}`);
    expect(await recallSubscriber(story.batchId, SHOPPER)).toMatchObject({ unsubscribed: false });
    await shopper.getByRole("button", { name: "Unsubscribe from recall alerts" }).click();
    await expect(shopper.getByText("You're unsubscribed.")).toBeVisible();
    expect(await recallSubscriber(story.batchId, SHOPPER)).toMatchObject({ unsubscribed: true });
    await shopper.close();

    // 5. Mail apps' built-in one-click unsubscribe works by POST only (a GET from a link scanner does nothing).
    expect((await request.get(`/api/recall/unsubscribe/${subscriber!.token}`)).status()).toBe(405);
    expect((await request.post(`/api/recall/unsubscribe/${subscriber!.token}`)).status()).toBe(200);
    expect((await request.post(`/api/recall/unsubscribe/${"0".repeat(48)}`)).status()).toBe(404);
  });
});
