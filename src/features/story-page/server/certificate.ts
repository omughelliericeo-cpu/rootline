// The certificate viewer behind each badge. A certificate file opens only if
// it belongs to this published batch's story AND is valid right now; the
// shopper is sent to a link that expires after 5 minutes.
import "server-only";
import { signedCertificateUrl } from "@/lib/storage";
import { storyBadges } from "../service";
import { loadStory } from "./queries";

export async function storyCertificateUrl(code: string, certificateId: string): Promise<string | null> {
  const raw = await loadStory(code);
  if (!raw) return null;
  // storyBadges only returns badges backed by a currently valid, applicable certificate.
  const badge = storyBadges(raw, new Date()).find((item) => item.certificateId === certificateId);
  const certificate = badge && raw.certificates.find((item) => item.id === certificateId);
  return certificate?.filePath ? signedCertificateUrl(certificate.filePath) : null;
}
