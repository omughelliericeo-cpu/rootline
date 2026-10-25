// A QR code with its link and download buttons (PNG, SVG, A4 sticker sheet).
// The SVG is drawn on the server from our own URL, so it is safe to inline.
import { buttonClasses } from "@/ui";
import { qrSvg } from "../server/render";

type QrCardProps = {
  url: string;
  /** Read out by screen readers, e.g. "QR code for Hazy Pale Ale, Brew 214". */
  label: string;
  /** Route that serves the files, e.g. /batches/{id}/qr; ?format= is added. */
  downloadPath: string;
  size?: "large" | "small";
};

export async function QrCard({ url, label, downloadPath, size = "large" }: QrCardProps) {
  const svg = await qrSvg(url);
  const link = (format: string) => `${downloadPath}?format=${format}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        role="img"
        aria-label={label}
        className={`${size === "large" ? "w-48" : "w-28"} shrink-0 rounded border border-line bg-white p-2 [&>svg]:h-auto [&>svg]:w-full`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <p className="break-all text-sm text-muted">{url}</p>
        <div className="flex flex-wrap gap-2">
          <a href={link("pdf")} className={buttonClasses("primary")}>
            Sticker sheet (A4 PDF)
          </a>
          <a href={link("png")} className={buttonClasses("secondary")}>
            PNG
          </a>
          <a href={link("svg")} className={buttonClasses("secondary")}>
            SVG
          </a>
        </div>
        {size === "large" && (
          <p className="text-xs text-muted">The sticker sheet fits standard 21-label A4 sheets (63.5 × 38.1 mm, e.g. Avery L7160).</p>
        )}
      </div>
    </div>
  );
}
