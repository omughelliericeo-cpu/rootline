// Producer: photos waiting for review (approve or reject), then the approved
// ones on story pages (remove). Waiting photos are private: they load through
// links that stop working after a few minutes.
import Link from "next/link";
import { dateKeyIn, formatDateKey } from "@/lib/dates";
import { Card, DeleteForm, Photo } from "@/ui";
import { removeShopperPhoto } from "../server/review-actions";
import type { ReviewPhoto } from "../server/queries";
import { attribution } from "../service";
import { ReviewButtons } from "./ReviewButtons";

type InboxProps = { pending: ReviewPhoto[]; approved: ReviewPhoto[]; timeZone: string; batchLabel: string };

export function ShopperPhotoInbox({ pending, approved, timeZone, batchLabel }: InboxProps) {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="waiting-heading" className="flex flex-col gap-4">
        <h2 id="waiting-heading" className="text-xl">
          Waiting for you ({pending.length})
        </h2>
        {pending.length === 0 && <p className="text-muted">Nothing to review. New photos from your story pages appear here.</p>}
        <ul className="flex flex-col gap-4">
          {pending.map((photo) => (
            <li key={photo.id}>
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* A plain img: the private link expires, so it must not be cached by the image optimiser. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.note ? `Shopper photo: ${photo.note}` : "Shopper photo"} className="aspect-square w-full rounded object-cover sm:w-48" />
                  <div className="flex flex-1 flex-col gap-3">
                    <PhotoDetails photo={photo} timeZone={timeZone} batchLabel={batchLabel} />
                    <ReviewButtons photoId={photo.id} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="approved-heading" className="flex flex-col gap-4">
        <h2 id="approved-heading" className="text-xl">
          On your story pages ({approved.length})
        </h2>
        {approved.length === 0 && <p className="text-muted">Approved photos appear here.</p>}
        <ul className="grid gap-4 sm:grid-cols-2">
          {approved.map((photo) => (
            <li key={photo.id}>
              <Card>
                <div className="flex flex-col gap-3">
                  <Photo src={photo.url} alt={photo.note ? `Shopper photo: ${photo.note}` : "Shopper photo"} aspect="square" sizes="(min-width: 640px) 400px, 100vw" />
                  <PhotoDetails photo={photo} timeZone={timeZone} batchLabel={batchLabel} />
                  <DeleteForm
                    action={removeShopperPhoto}
                    fields={{ photoId: photo.id }}
                    label="Remove"
                    confirmMessage="Remove this photo from the story page and delete it?"
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PhotoDetails({ photo, timeZone, batchLabel }: { photo: ReviewPhoto; timeZone: string; batchLabel: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      {photo.note && <p className="text-base">&ldquo;{photo.note}&rdquo;</p>}
      <p className="text-muted">
        {attribution(photo.firstName)} · {formatDateKey(dateKeyIn(photo.sharedAt, timeZone))} ·{" "}
        <Link href={`/batches/${photo.batchId}`} aria-label={`${batchLabel}: ${photo.batchName}`}>
          {photo.batchName}
        </Link>
      </p>
    </div>
  );
}
