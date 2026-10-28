// Forgot password, changing the password, and deleting the account.
// Reset links are made with the Supabase admin API, so no email is sent.
import { expect, test } from "@playwright/test";
import {
  accountState,
  createTestProducer,
  deleteTestProducer,
  fileExists,
  goToMenu,
  logIn,
  logOut,
  putFile,
  recoveryLink,
  type TestProducer,
} from "./support/producer";

test.describe("account", () => {
  let producer: TestProducer;

  test.beforeEach(async () => {
    producer = await createTestProducer("brewery", "STARTER");
  });
  test.afterEach(async () => {
    await deleteTestProducer(producer);
  });

  test("a reset link lets the owner choose a new password, once", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Forgot your password?");

    const link = await recoveryLink(producer.email);
    await page.goto(link);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choose a new password");

    await page.getByLabel("New password", { exact: true }).fill("Brand-new-pass-1");
    await page.getByLabel("New password again").fill("Something-else-2");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("The two passwords don't match")).toBeVisible();

    await page.getByLabel("New password again").fill("Brand-new-pass-1");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("Your password has been changed.")).toBeVisible();

    // The recovery cookie is used up: the page can't be used again without a new link.
    await page.goto("/reset-password");
    await expect(page).toHaveURL(/\/forgot-password\?error=expired/);

    await page.goto("/dashboard");
    await logOut(page);
    await logIn(page, { ...producer, password: "Brand-new-pass-1" });
  });

  test("a logged-in owner can't skip the reset link, and an old link fails", async ({ page }) => {
    await logIn(page, producer);
    await page.goto("/reset-password");
    await expect(page).toHaveURL(/\/forgot-password\?error=expired/);
    await expect(page.getByText("That reset link is invalid or has expired")).toBeVisible();

    await page.goto("/auth/confirm?token_hash=not-a-real-token&type=recovery");
    await expect(page).toHaveURL(/\/forgot-password\?error=expired/);
  });

  test("changing the password asks for the current one", async ({ page }) => {
    await logIn(page, producer);
    await goToMenu(page, "Account");
    await expect(page.getByText(`You log in with ${producer.email}`)).toBeVisible();

    await page.getByLabel("Current password").fill("not-my-password");
    await page.getByLabel("New password", { exact: true }).fill("Changed-pass-3");
    await page.getByLabel("New password again").fill("Changed-pass-3");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("That isn't your current password")).toBeVisible();

    await page.getByLabel("Current password").fill(producer.password);
    await page.getByLabel("New password", { exact: true }).fill("Changed-pass-3");
    await page.getByLabel("New password again").fill("Changed-pass-3");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Your password has been changed.")).toBeVisible();

    await logOut(page);
    await logIn(page, { ...producer, password: "Changed-pass-3" });
  });

  test("deleting the account removes the brand, its files and the login", async ({ page }) => {
    const logo = `${producer.brandId}/logo/test.png`;
    await putFile("brand-media", logo);
    await logIn(page, producer);
    await page.goto("/account");

    await page.getByLabel("Your password").fill(producer.password);
    await page.getByLabel("Type DELETE to confirm").fill("delete it");
    await page.getByRole("button", { name: "Delete my account" }).click();
    // The label plus the error under the field.
    await expect(page.getByText("Type DELETE to confirm", { exact: true })).toHaveCount(2);
    expect(await accountState(producer)).toEqual({ login: true, brand: true });

    await page.getByLabel("Your password").fill("wrong-password");
    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page.getByText("That isn't your password")).toBeVisible();
    expect(await accountState(producer)).toEqual({ login: true, brand: true });

    await page.getByLabel("Your password").fill(producer.password);
    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page).toHaveURL(/\/login\?notice=deleted/, { timeout: 30_000 });
    await expect(page.getByText("Your account and everything in it have been deleted")).toBeVisible();

    expect(await accountState(producer)).toEqual({ login: false, brand: false });
    expect(await fileExists("brand-media", logo)).toBe(false);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
