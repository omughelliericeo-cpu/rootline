// The brand's certificates with their current state (worked out now, never stored).
import { optionLabel, type IndustryTemplate } from "@/features/industries";
import { formatDateKey, storedDateKey } from "@/lib/dates";
import { Badge, ButtonLink, Card } from "@/ui";
import type { CertificateView } from "../server/queries";
import { certificateState, daysUntilExpiry, stateLabel, type CertificateState } from "../service";
import { CertificateActions } from "./CertificateActions";

const TONES: Record<CertificateState, "verified" | "warning" | "draft"> = {
  valid: "verified",
  expiring: "warning",
  expired: "draft",
  revoked: "draft",
  "missing-file": "draft",
};

type CertificateListProps = {
  certificates: CertificateView[];
  template: IndustryTemplate;
  now: Date;
  timeZone: string;
};

export function CertificateList({ certificates, template, now, timeZone }: CertificateListProps) {
  if (certificates.length === 0) {
    return (
      <Card>
        <h2 className="mb-2 text-xl">No certificates yet</h2>
        <p className="mb-5 max-w-prose text-muted">
          Claims such as {template.allowedBadges.slice(0, 2).map((badge) => badge.label).join(" or ")} only appear as
          badges on your story pages while a current certificate is on file.
        </p>
        <ButtonLink href="/certificates/new">Upload a certificate</ButtonLink>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {certificates.map((certificate) => {
        const state = certificateState(certificate, now, timeZone);
        const claimLabel = optionLabel(template.allowedBadges, certificate.claim);
        return (
          <li key={certificate.id}>
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl">{claimLabel}</h2>
                  <p className="text-sm text-muted">
                    {certificate.issuer} · Covers {certificate.coversLabel} · Until {formatDateKey(storedDateKey(certificate.expiresOn))}
                  </p>
                </div>
                <Badge tone={TONES[state]}>{stateLabel(state, daysUntilExpiry(certificate, now, timeZone))}</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <a href={`/certificates/${certificate.id}/file`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm">
                  View {certificate.fileName}
                </a>
                <CertificateActions certificateId={certificate.id} label={claimLabel} revoked={certificate.status === "REVOKED"} />
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
