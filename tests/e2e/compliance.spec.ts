// Compliance export: the producer downloads a batch's record as CSV and PDF
// from the batch page; other people's batches are not available.
import { expect, test } from "@playwright/test";
import { createTestProducer, deleteTestProducer, logIn, seedPublishedStory, type PublishedStory, type TestProducer } from "./support/producer";

test.describe("compliance export", () => {
  let producer: TestProducer;
  let story: PublishedStory;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
    story = await seedPublishedStory(producer);
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("downloads the batch record as CSV and PDF", async ({ page }) => {
    await logIn(page, producer);
    await page.goto(`/batches/${story.batchId}`);
    await expect(page.getByRole("heading", { name: "Compliance export" })).toBeVisible();

    const csvLink = page.getByRole("link", { name: "Download CSV" });
    const csv = await page.request.get((await csvLink.getAttribute("href"))!);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(csv.headers()["content-disposition"]).toContain("hazy-pale-ale-brew-214-compliance.csv");
    const text = await csv.text();
    expect(text).toContain("Kowalski Farm");
    expect(text).toContain("KF-2026-118");
    expect(text).toContain("Coquitlam cold storage");

    const pdfLink = page.getByRole("link", { name: "Download PDF" });
    const pdf = await page.request.get((await pdfLink.getAttribute("href"))!);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
  });

  test("another brand's batch cannot be exported", async ({ page }) => {
    const other = await createTestProducer("coffee");
    try {
      await logIn(page, other);
      const response = await page.request.get(`/batches/${story.batchId}/export?format=csv`);
      expect(response.status()).toBe(404);
    } finally {
      await deleteTestProducer(other);
    }
  });
});
