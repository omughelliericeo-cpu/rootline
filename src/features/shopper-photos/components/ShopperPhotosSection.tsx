// Story page: "From people who've tried it". Approved shopper photos, then
// the "Share your photo" form, folded away until tapped (works without JavaScript).
import { Photo } from "@/ui";
import { attribution, consentText } from "../service";
import { SharePhotoForm } from "./SharePhotoForm";

export type StoryShopperPhoto = { url: string; note: string | null; firstName: string | null };

type ShopperPhotosSectionProps = { photos: StoryShopperPhoto[]; batchCode: string; brandName: string; acceptsPhotos: boolean };

export function ShopperPhotosSection({ photos, batchCode, brandName, acceptsPhotos }: ShopperPhotosSectionProps) {
  // Nothing to show: no approved photos and this brand's plan does not collect new ones.
  if (!acceptsPhotos && photos.length === 0) return null;
  return (
    <section className="flex flex-col gap-5 border-t border-line px-5 py-8" aria-labelledby="shopper-photos-heading">
      <h2 id="shopper-photos-heading" className="text-2xl">
        From people who&rsquo;ve tried it
      </h2>
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4">
          {photos.map((photo) => (
            <li key={photo.url}>
              <figure className="flex flex-col gap-2">
                <Photo src={photo.url} alt={photo.note ? `Shopper photo: ${photo.note}` : "Photo shared by a shopper"} aspect="square" sizes="(min-width: 512px) 240px, 50vw" />
                <figcaption className="text-sm">
                  {photo.note && <span className="block">&ldquo;{photo.note}&rdquo;</span>}
                  <span className="text-xs text-muted">{attribution(photo.firstName)}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No photos yet. Be the first to share how you enjoyed it.</p>
      )}
      {acceptsPhotos && (
        <details className="rounded border border-line bg-card px-4 py-3">
          <summary className="min-h-11 cursor-pointer content-center font-medium">Share your photo</summary>
          <div className="pt-4">
            <SharePhotoForm batchCode={batchCode} brandName={brandName} consent={consentText(brandName)} />
          </div>
        </details>
      )}
    </section>
  );
}
