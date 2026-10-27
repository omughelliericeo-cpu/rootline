// Shopper photos: a shopper shares photos from the story page (with and
// without JavaScript), nothing shows until the producer approves, the
// approved photo appears on the story page, and a rejected one is deleted.
import { expect, test } from "@playwright/test";
import {
  createTestProducer,
  deleteTestProducer,
  fileExists,
  goToMenu,
  logIn,
  seedPublishedStory,
  shopperPhotos,
  storedFile,
  type PublishedStory,
  type TestProducer,
} from "./support/producer";

/** A 3000x2000 PNG drawn in the browser, like a big phone photo; the page shrinks it to a JPEG before upload. */
async function bigPhoto(page: import("@playwright/test").Page): Promise<Buffer> {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 3000;
    canvas.height = 2000;
    const context = canvas.getContext("2d")!;
    for (let i = 0; i < 400; i += 1) {
      context.fillStyle = `hsl(${(i * 37) % 360} 50% 50%)`;
      context.fillRect((i * 97) % 3000, (i * 53) % 2000, 300, 200);
    }
    return canvas.toDataURL("image/png");
  });
  return Buffer.from(dataUrl.split(",")[1]!, "base64");
}

// A tiny JPEG carrying an EXIF block with a GPS note, sent as-is (JavaScript off).
function jpegWithLocation(): Buffer {
  const segment = (marker: number, payload: Buffer) => Buffer.concat([Buffer.from([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload]);
  const exif = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), Buffer.from([0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0]), Buffer.from("GPS 49.2838 -122.8317", "latin1")]);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    segment(0xe1, exif),
    segment(0xdb, Buffer.from([0, 1, 2])),
    Buffer.from([0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0xff, 0xd9]),
  ]);
}

test.describe("shopper photos", () => {
  let producer: TestProducer;
  let story: PublishedStory;

  test.beforeAll(async () => {
    producer = await createTestProducer("brewery");
    story = await seedPublishedStory(producer);
  });

  test.afterAll(async () => {
    if (producer) await deleteTestProducer(producer);
  });

  test("share, review, approve, reject, remove", async ({ page, browser }) => {
    // 1. A shopper shares a photo from the story page (JavaScript on).
    const shopper = await browser.newPage();
    await shopper.goto(`/b/${story.batchCode}`);
    await expect(shopper.getByText("No photos yet.")).toBeVisible();
    await shopper.getByText("Share your photo").click();
    await shopper.getByLabel("Your photo").setInputFiles({ name: "tacos.png", mimeType: "image/png", buffer: await bigPhoto(shopper) });
    await shopper.getByLabel("A few words (optional)").fill("Perfect with fish tacos");
    await shopper.getByLabel("First name (optional)").fill("Sam Okafor");
    await shopper.getByLabel(/I took this photo/).check();
    await shopper.getByRole("button", { name: "Share my photo" }).click();
    await expect(shopper.getByText("Thank you! Your photo will appear here")).toBeVisible();

    // 2. Another shares without JavaScript; the server removes the hidden location itself.
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const plain = await noScript.newPage();
    await plain.goto(`/b/${story.batchCode}`);
    await plain.getByText("Share your photo").click();
    await plain.getByLabel("Your photo").setInputFiles({ name: "home.jpg", mimeType: "image/jpeg", buffer: jpegWithLocation() });
    await plain.getByLabel("A few words (optional)").fill("Taken at my house");
    await plain.getByLabel(/I took this photo/).check();
    await plain.getByRole("button", { name: "Share my photo" }).click();
    await expect.poll(async () => (await shopperPhotos(story.batchId)).length).toBe(2);
    await noScript.close();

    const [first, second] = await shopperPhotos(story.batchId);
    expect(first).toMatchObject({ status: "PENDING", note: "Perfect with fish tacos", firstName: "Sam" });
    expect(first!.photoPath).toMatch(/\.jpg$/); // shrunk to JPEG in the browser
    const kept = await storedFile("shopper-photos", second!.photoPath);
    expect(kept).not.toBeNull();
    expect(kept!.includes("GPS")).toBe(false);
    expect(kept!.includes("Exif")).toBe(false);

    // 3. Nothing is public yet.
    await shopper.reload();
    await expect(shopper.getByText("No photos yet.")).toBeVisible();

    // 4. The producer approves one and rejects the other.
    await logIn(page, producer);
    await goToMenu(page, "Shopper photos (2)");
    await expect(page.getByRole("heading", { name: "Waiting for you (2)" })).toBeVisible();
    const tacos = page.getByRole("listitem").filter({ hasText: "Perfect with fish tacos" });
    await tacos.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByRole("heading", { name: "On your story pages (1)" })).toBeVisible();
    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByRole("heading", { name: "Waiting for you (0)" })).toBeVisible();
    expect(await shopperPhotos(story.batchId)).toEqual([expect.objectContaining({ status: "APPROVED", note: "Perfect with fish tacos" })]);
    expect(await fileExists("shopper-photos", second!.photoPath)).toBe(false);
    expect(await fileExists("shopper-photos", first!.photoPath)).toBe(false); // approved: moved to the public bucket
    expect(await fileExists("brand-media", first!.photoPath)).toBe(true);

    // 5. The approved photo is on the story page, with the first name only.
    await shopper.reload();
    const wall = shopper.getByRole("region", { name: "From people who’ve tried it" });
    await expect(wall.getByText("“Perfect with fish tacos”")).toBeVisible();
    await expect(wall.getByText("Sam", { exact: true })).toBeVisible();
    await expect(wall.getByText("Taken at my house")).toHaveCount(0);

    // 6. Removing it takes it off the story page.
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("heading", { name: "On your story pages (0)" })).toBeVisible();
    await shopper.reload();
    await expect(shopper.getByText("No photos yet.")).toBeVisible();
    expect(await fileExists("brand-media", first!.photoPath)).toBe(false);
    await shopper.close();
  });
});
