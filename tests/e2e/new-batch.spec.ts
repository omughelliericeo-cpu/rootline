// Producer journey (Milestone 3 part): the 3-step New batch flow on a phone,
// publishing, QR downloads, a quick second batch pre-filled from the first,
// and a shelf code pointed at a batch.
import { expect, test, type Page } from "@playwright/test";
import { createTestProducer, deleteTestProducer, logIn, seedCatalogue, type TestProducer } from "./support/producer";

const STOPS = [
  { address: "2711 Murray St, Port Moody, BC", coordinates: "49.2838, -122.8317" },
  { address: "Coquitlam, BC", coordinates: "49.2488, -122.8125" },
  { address: "Burnaby, BC", coordinates: "49.2488, -122.9805" },
  { address: "Main St, Vancouver, BC", coordinates: "49.2620, -123.1006" },
];

async function startBatch(page: Page, packagedOn: string) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "New brew" }).click();
  await expect(page.getByText("1. Beer & dates")).toBeVisible();
  await page.getByLabel("Canned on").fill(packagedOn);
  await page.getByRole("button", { name: "Next: lots" }).click();
  await page.waitForURL(/\/lots$/);
}

test.describe("new batch", () => {
  let producer: TestProducer;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
    await seedCatalogue(producer);
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("a brewery creates, publishes and prints brews", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await logIn(page, producer);
    const today = new Date().toISOString().slice(0, 10);

    // Brew 1, step 1 (product and dates) and step 2 (lots: empty for a first brew).
    await startBatch(page, today);
    await page.getByLabel("Supplier 1").selectOption({ label: "Kowalski Farm (Pilsner malt)" });
    await page.getByLabel("What came from them").first().fill("Pilsner malt");
    await page.getByLabel("Lot number").first().fill("KF-2026-118");
    await page.getByRole("button", { name: "Next: print" }).click();
    await page.waitForURL(/\/print$/);

    // Step 3: the QR is ready, but publishing waits for map positions on the default stops.
    await expect(page.getByRole("img", { name: /QR code for Hazy Pale Ale, Brew 1/ })).toBeVisible();
    await expect(page.getByText("Stop 2 (Cold storage) needs an address and map position.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeDisabled();

    // Fill in the journey, then publish.
    await page.getByRole("link", { name: "Edit the journey" }).click();
    for (const [index, stop] of STOPS.entries()) {
      await page.locator(`#stop-${index}-address`).fill(stop.address);
      await page.locator(`#stop-${index}-coordinates`).fill(stop.coordinates);
    }
    await page.locator("#stop-1-note").fill("Kept at 3°C");
    await page.getByRole("button", { name: "Save journey" }).click();
    await expect(page.getByText("Journey saved.")).toBeVisible();
    await page.getByRole("link", { name: /Back to the brew/ }).click();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Published. Shoppers who scan the code now see this batch.")).toBeVisible();
    await expect(page.getByText("Live", { exact: true })).toBeVisible();

    // QR downloads: SVG, PNG and the A4 sticker sheet.
    const batchPath = new URL(page.url()).pathname;
    for (const [format, type, start] of [
      ["svg", "image/svg+xml", "<svg"],
      ["png", "image/png", "\x89PNG"],
      ["pdf", "application/pdf", "%PDF"],
    ] as const) {
      const response = await page.request.get(`${batchPath}/qr?format=${format}`);
      expect(response.headers()["content-type"]).toBe(type);
      expect((await response.body()).toString("latin1").startsWith(start)).toBe(true);
    }

    // Brew 2: lots and journey come from brew 1, so it is three quick screens.
    const started = Date.now();
    await startBatch(page, today);
    await expect(page.getByLabel("Lot number").first()).toHaveValue("KF-2026-118");
    await page.getByRole("button", { name: "Next: print" }).click();
    await page.waitForURL(/\/print$/);
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText(/^Published\./)).toBeVisible();
    expect(Date.now() - started).toBeLessThan(120_000);
    await expect(page.getByText("Hazy Pale Ale, Brew 2").first()).toBeVisible();

    // A shelf code for the tap, pointed at brew 1 and then moved to brew 2.
    await page.getByRole("link", { name: "Shelf codes" }).click();
    await page.getByLabel("Where it goes").fill("Tap 3");
    await page.getByLabel("Points to (optional)").selectOption({ label: "Hazy Pale Ale, Brew 1" });
    await page.getByRole("button", { name: "Create shelf code" }).click();
    await expect(page.getByRole("heading", { name: "Tap 3" })).toBeVisible();
    await page.getByLabel("Points to", { exact: true }).selectOption({ label: "Hazy Pale Ale, Brew 2" });
    await page.getByRole("button", { name: "Repoint" }).click();
    await expect(page.getByText("Shelf code now points to that batch.")).toBeVisible();
  });
});
