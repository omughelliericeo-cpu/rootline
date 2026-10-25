"use client";
// "Share this story": the phone's share sheet where available, otherwise
// copies the link. Without JavaScript it is a plain link to the page.
import { useState, type MouseEvent } from "react";
import { buttonClasses } from "@/ui";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // The shopper closed the share sheet; nothing to do.
      }
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
  }

  return (
    <a href={url} onClick={share} className={buttonClasses("secondary", true)}>
      {copied ? "Link copied" : "Share this story"}
    </a>
  );
}
