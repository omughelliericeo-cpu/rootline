// Producer journey (Milestone 1 part): sign-up asks what you make, login
// works, and the brand profile can be edited on a phone.
// The full "signs up and publishes a batch" journey is completed in M9.
import { expect, test } from "@playwright/test";
import { createTestProducer, deleteTestProducer, goToMenu, logOut, type TestProducer } from "./support/producer";

// A 1x1 PNG, enough to prove uploads reach storage and display again.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("producer account", () => {
  let producer: TestProducer;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("sign-up starts with 'What do you make?' and loads the industry's words", async ({ page }) => {
    await page.goto("/signup");
    // Brewery and winery share a card: clicking it shows the two choices.
    await page.getByText("Brewery & winery", { exact: true }).last().click();
    await page.getByRole("radio", { name: "Brewery" }).check();
    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Set up your brewery");
    await expect(page.getByLabel("Brewery name")).toBeVisible();
  });

  test("redirects to login when logged out", async ({ page }) => {
    await page.goto("/brand");
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects a wrong password with a clear message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(producer.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("That email and password do not match an account.")).toBeVisible();
  });

  test("logs in, edits the brand profile and adds a person", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(producer.email);
    await page.getByLabel("Password").fill(producer.password);
    await page.getByRole("button", { name: "Log in" }).click();

    // Generous timeout: the first visit compiles the dashboard in dev mode.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(producer.brandName);

    await goToMenu(page, "Brand profile");
    await expect(page.getByText("Brewery profile")).toBeVisible();

    await page.getByLabel("Quote (optional)").fill("We brew with what grows nearby.");
    await page.getByRole("button", { name: "Save details" }).click();
    await expect(page.getByRole("status")).toHaveText("Profile saved.");

    await page.getByLabel("Video link (optional)").fill("https://example.com/video");
    await page.getByRole("button", { name: "Save details" }).click();
    await expect(page.getByText("Use a YouTube or Vimeo link")).toBeVisible();

    const addPerson = page.locator("form", { has: page.getByRole("heading", { name: "Add a person" }) });
    await addPerson.getByLabel("Name").fill("Ada Kowalski");
    await addPerson.getByLabel("Role").fill("Head brewer");
    await addPerson.getByRole("button", { name: "Add person" }).click();
    await expect(page.getByRole("button", { name: "Save Ada Kowalski" })).toBeVisible();

    await page.getByLabel("Upload a logo").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: TINY_PNG });
    await page.getByRole("button", { name: "Upload logo" }).click();
    await expect(page.getByText("Logo updated.")).toBeVisible();
    await expect(page.getByAltText(`${producer.brandName} logo`)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Quote (optional)")).toHaveValue("We brew with what grows nearby.");

    await logOut(page);
    await expect(page).toHaveURL(/\/login/);
  });
});
