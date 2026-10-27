// Shopper photos: approve or reject photos shared from story pages, and
// remove approved ones.
import type { Metadata } from "next";
import { UpgradeNotice, ownerCan } from "@/features/billing";
import { getTemplate } from "@/features/industries";
import { ShopperPhotoInbox, listShopperPhotos } from "@/features/shopper-photos";
import { requireOwner } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Shopper photos" };

export default async function ShopperPhotosPage() {
  const owner = await requireOwner();
  const { pending, approved } = await listShopperPhotos(owner);

  return (
    <PageShell
      title="Shopper photos"
      description="Photos shoppers shared from your story pages. Nothing is shown until you approve it. Rejected photos are deleted."
    >
      {!ownerCan(owner, "shopperPhotos") && (
        <UpgradeNotice title="Shopper photos are part of Growth" className="mb-6">
          Let shoppers share photos from your story pages. You approve each one before it appears.
        </UpgradeNotice>
      )}
      <ShopperPhotoInbox pending={pending} approved={approved} timeZone={owner.timezone} batchLabel={getTemplate(owner.industry).labels.batch} />
    </PageShell>
  );
}
