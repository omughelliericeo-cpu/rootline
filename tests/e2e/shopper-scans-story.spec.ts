// Shopper journey: scan a QR code (no app, no login) and see the story on a
// phone: freshness, verified badge with its certificate, map, stop details.
// Also: the page without JavaScript, a shelf code, a draft, and scan counting.
import { expect, test } from "@playwright/test";
import { createTestProducer, deleteTestProducer, scanCount, seedPublishedStory, type PublishedStory, type TestProducer } from "./support/producer";

test.describe("shopper scans and sees the story", () => {
  let producer: TestProducer;
  let story: PublishedStory;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
    story = await seedPublishedStory(producer);
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("the story page tells where the beer came from", async ({ page }) => {
    await page.goto(`/b/${story.batchCode}`);

    await expect(page.getByText("Brew 214 · Hazy Pale Ale")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Brewed in Port Moody, BC.");
    await expect(page.getByText("Canned today")).toBeVisible();
    await expect(page.getByText("Four ingredients. Nothing hidden.")).toBeVisible();
    await expect(page.getByText("Contains gluten (barley)")).toBeVisible();

    // The map draws numbered stops once it has loaded.
    await expect(page.locator(".rl-marker-stop")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Show the farms too" })).toBeVisible();

    // Tapping a stop shows its details.
    await page.getByText("Coquitlam cold storage").click();
    await expect(page.getByText("Held at 3°C")).toBeVisible();
    await page.getByText("Pilsner malt").first().click();
    await expect(page.getByText("KF-2026-118")).toBeVisible();

    // The verified badge opens the certificate file.
    const badge = page.getByRole("link", { name: "B Corp: verified, view the certificate" });
    const certificate = await page.request.get((await badge.getAttribute("href"))!);
    expect(certificate.status()).toBe(200);
    expect(certificate.headers()["content-type"]).toContain("pdf");
  });

  test("the core story works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`/b/${story.batchCode}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Brewed in Port Moody, BC.");
    // No map is drawn (Playwright cannot search <noscript> text, so check the map's absence instead).
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await expect(page.getByText("Port Moody brewery")).toBeVisible();
    await expect(page.getByRole("link", { name: "B Corp: verified, view the certificate" })).toBeVisible();
    await context.close();
  });

  test("a shelf code opens the batch it points to", async ({ page }) => {
    await page.goto(`/s/${story.shelfCode}`);
    await expect(page).toHaveURL(new RegExp(`/b/${story.batchCode}\\?via=shelf$`));
    await expect(page.getByText("Brew 214 · Hazy Pale Ale")).toBeVisible();
  });

  test("a draft batch is not public", async ({ page }) => {
    const response = await page.goto(`/b/${story.draftCode}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This story is not available" })).toBeVisible();
  });

  test("each view is counted as a scan", async () => {
    // Earlier tests opened the story several times; scans are saved just after the page is sent.
    await expect.poll(() => scanCount(story.batchId), { timeout: 10_000 }).toBeGreaterThan(0);
  });
});
