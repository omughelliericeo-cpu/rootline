// The certificates table: claim and issuer, what it covers, expiry, current
// state (worked out now, never stored), and view / revoke / delete.
import { optionLabel, type IndustryTemplate } from "@/features/industries";
import { formatDateKey, storedDateKey } from "@/lib/dates";
import { Badge, ButtonLink, Card, Table, Td, Th } from "@/ui";
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
    <Table caption="Certificates">
      <thead>
        <tr>
          <Th>Certificate</Th>
          <Th>Covers</Th>
          <Th>Expires</Th>
          <Th>Status</Th>
          <Th>
            <span className="sr-only">Actions</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {certificates.map((certificate) => {
          const state = certificateState(certificate, now, timeZone);
          const claimLabel = optionLabel(template.allowedBadges, certificate.claim);
          return (
            <tr key={certificate.id}>
              <Td>
                <p className="font-medium">{claimLabel}</p>
                <p className="text-xs text-muted">{certificate.issuer}</p>
              </Td>
              <Td className="text-muted">{certificate.coversLabel}</Td>
              <Td className="whitespace-nowrap text-muted">{formatDateKey(storedDateKey(certificate.expiresOn))}</Td>
              <Td>
                <Badge tone={TONES[state]}>{stateLabel(state, daysUntilExpiry(certificate, now, timeZone))}</Badge>
              </Td>
              <Td>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <a href={`/certificates/${certificate.id}/file`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm" aria-label={`View ${certificate.fileName}`}>
                    View
                  </a>
                  <CertificateActions certificateId={certificate.id} label={claimLabel} revoked={certificate.status === "REVOKED"} />
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
