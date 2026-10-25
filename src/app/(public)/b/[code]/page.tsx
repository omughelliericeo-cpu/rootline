// GET /b/{code}: the public story page shoppers reach by scanning a batch's
// QR code. No login. Shows only LIVE or SOLD_OUT batches; anything else is
// "not found". Each view is counted as a scan, after the page is sent.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { recordScan, scanSource } from "@/features/analytics";
import { StoryPage, buildStory, loadStory } from "@/features/story-page";
import { serverConfig } from "@/lib/config";
import { getRequestId } from "@/lib/request-context";
import { publicMediaUrl } from "@/lib/storage";

export async function generateMetadata({ params }: PageProps<"/b/[code]">): Promise<Metadata> {
  const { code } = await params;
  const raw = await loadStory(code);
  if (!raw) return { title: "Not found" };
  const story = buildStory(raw, new Date());
  return {
    title: { absolute: `${story.title} · ${story.brandName}` },
    description: `${story.headline} See where it came from, batch by batch.`,
    openGraph: story.photoPath ? { images: [publicMediaUrl(story.photoPath)] } : undefined,
  };
}

export default async function StoryRoute({ params, searchParams }: PageProps<"/b/[code]">) {
  const { code } = await params;
  const raw = await loadStory(code);
  if (!raw) notFound();

  const { via } = await searchParams;
  const requestHeaders = new Headers(await headers());
  const requestId = await getRequestId();
  after(() => recordScan({ batchId: raw.batch.id, via: scanSource(via), headers: requestHeaders, requestId }));

  const url = `${serverConfig().APP_URL.replace(/\/+$/, "")}/b/${code}`;
  return <StoryPage story={buildStory(raw, new Date())} code={code} url={url} logoPath={raw.brand.logoPath} />;
}
