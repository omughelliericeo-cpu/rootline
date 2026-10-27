// Producer journey (Milestone 2 part): add a supplier, a product and a
// certificate on a phone; check the "in use" protection and revoking.
import { expect, test, type Page } from "@playwright/test";
import { createTestProducer, deleteTestProducer, goToMenu, logIn, type TestProducer } from "./support/producer";

// The smallest valid PDF, enough to prove certificate uploads reach storage.
// A 1x1 PNG standing in for a supplier photo.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const TINY_PDF = Buffer.from(
  "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 10 10]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
);

function nextYear(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

async function uploadCertificate(page: Page, claim: string, covers: string) {
  await page.goto("/certificates/new");
  await page.getByLabel("Claim").selectOption({ label: claim });
  await page.getByLabel("Issued by").fill("B Lab");
  await page.getByLabel("Expiry date").fill(nextYear());
  await page.getByLabel("Covers").selectOption({ label: covers });
  await page.getByLabel("Certificate file").setInputFiles({ name: "certificate.pdf", mimeType: "application/pdf", buffer: TINY_PDF });
  await page.getByRole("button", { name: "Upload certificate" }).click();
  await page.waitForURL(/\/certificates$/);
}

test.describe("suppliers, products and certificates", () => {
  let producer: TestProducer;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("a brewery adds its supplier, beer and certificates", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await logIn(page, producer);

    // Supplier, including a helpful error for a bad map position.
    await goToMenu(page, "Suppliers");
    await page.getByRole("link", { name: "Add a supplier" }).click();
    await page.getByLabel("Name").fill("Kowalski Farm");
    await page.getByLabel("Type").selectOption({ label: "Maltster or grain farm" });
    await page.getByLabel("What they supply").fill("Pilsner malt");
    await page.getByLabel("Address").fill("Armstrong, BC");
    await page.getByLabel("Map position").fill("near the river");
    await page.getByRole("button", { name: "Add supplier" }).click();
    await expect(page.getByText("Enter latitude and longitude")).toBeVisible();
    await page.getByLabel("Map position").fill("50.4148, -119.1937");
    await page.getByLabel("Photo (optional)").setInputFiles({ name: "farm.png", mimeType: "image/png", buffer: TINY_PNG });
    await page.getByRole("button", { name: "Add supplier" }).click();
    await page.waitForURL(/\/suppliers$/);
    await expect(page.getByRole("link", { name: /Kowalski Farm/ })).toBeVisible();
    // The photo is optional; when added it shows as a thumbnail in the list.
    await expect(page.locator("li", { hasText: "Kowalski Farm" }).locator("img")).toHaveCount(1);

    // Product: the brewery template's words and fields appear; ABV is required.
    await goToMenu(page, "Beers");
    await page.getByRole("link", { name: "Add a beer" }).click();
    await page.getByLabel("Name").fill("Hazy Pale Ale");
    await page.getByLabel("Format").fill("473 ml can");
    await page.getByLabel("Style (optional)").fill("Hazy Pale Ale");
    await page.getByLabel("Water").check();
    await page.getByLabel("Malted barley").check();
    await page.getByLabel("Other ingredients (optional)").fill("Citra hops");
    await page.getByLabel("Gluten (barley)").check();
    await page.getByLabel("Alcohol (%)").fill("strong");
    await page.getByRole("button", { name: "Add product" }).click();
    await expect(page.getByText("Alcohol must be a number")).toBeVisible();
    // A failed save keeps everything already entered.
    await expect(page.getByLabel("Name")).toHaveValue("Hazy Pale Ale");
    await expect(page.getByLabel("Gluten (barley)")).toBeChecked();
    await page.getByLabel("Alcohol (%)").fill("6.2");
    await page.getByRole("button", { name: "Add product" }).click();
    await page.waitForURL(/\/products$/);
    await expect(page.getByRole("row", { name: /Hazy Pale Ale/ }).getByRole("cell", { name: "Gluten (barley)" })).toBeVisible();

    // Certificates: a brand-wide B Corp, and an Organic one on the beer.
    await uploadCertificate(page, "B Corp", `Whole brand (${producer.brandName})`);
    await uploadCertificate(page, "Organic", "Beer: Hazy Pale Ale");
    await expect(page.getByRole("row", { name: /B Corp/ })).toBeVisible();
    await expect(page.getByText("Valid", { exact: true })).toHaveCount(2);

    // The private file opens through a short-lived link.
    const fileLink = page.getByRole("link", { name: "View certificate.pdf" }).first();
    const fileResponse = await page.request.get((await fileLink.getAttribute("href"))!);
    expect(fileResponse.status()).toBe(200);

    // A beer with a certificate cannot be deleted.
    await page.goto("/products");
    await page.getByRole("link", { name: "Hazy Pale Ale" }).click();
    await page.getByRole("button", { name: "Delete product" }).click();
    await expect(page.getByText("This product has certificates or batches")).toBeVisible();

    // Revoking removes the certificate's validity straight away.
    await page.goto("/certificates");
    const organic = page.getByRole("row").filter({ hasText: "Organic" });
    await organic.getByRole("button", { name: "Revoke" }).click();
    await expect(organic.getByText("Revoked", { exact: true })).toBeVisible();
  });
});
