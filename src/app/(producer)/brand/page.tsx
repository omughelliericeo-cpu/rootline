// Brand profile: details, logo, photos and people.
import type { Metadata } from "next";
import { BrandProfileForm, LogoUpload, PeopleList, PhotoGallery, getBrandProfile } from "@/features/brand";
import { getTemplate } from "@/features/industries";
import { requireOwner } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Brand profile" };

export default async function BrandPage() {
  const owner = await requireOwner();
  const profile = await getBrandProfile(owner);
  const template = getTemplate(owner.industry);

  return (
    <PageShell
      eyebrow={`${template.labels.place} profile`}
      title={profile.name}
      description="Everything here appears on your public story pages."
    >
      <div className="flex flex-col gap-6">
        <BrandProfileForm profile={profile} />
        <LogoUpload logoUrl={profile.logoUrl} brandName={profile.name} />
        <PhotoGallery photos={profile.photos} brandName={profile.name} />
        <PeopleList people={profile.people} makerLabel={template.labels.maker} />
      </div>
    </PageShell>
  );
}
