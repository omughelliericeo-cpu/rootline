// Sending email (recall alerts) through Resend.
// Every message is sent individually (never one email with everyone in To or
// BCC), so no shopper ever sees another shopper's address.
// With EMAIL_PROVIDER=log the emails are only written to the logs: used by
// the automated tests and for trying the app without a Resend account.
import "server-only";
import { Resend } from "resend";
import { serverConfig } from "./config";
import { AppError } from "./errors";
import { logger } from "./logger";

export type OutgoingEmail = { to: string; subject: string; text: string; html: string; headers?: Record<string, string> };
export type SendSummary = { sent: number; failed: number };

/** Resend accepts up to 100 emails per batch call. */
const BATCH_SIZE = 100;

/** "jess@example.com" -> "j***@example.com", so logs never hold full addresses. */
export function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

/** True when emails can actually go out (or be logged): check before saving a recall. */
export function emailReady(): boolean {
  const config = serverConfig();
  return config.EMAIL_PROVIDER === "log" || Boolean(config.RESEND_API_KEY);
}

type SendOptions = {
  /** The same key is never sent twice by Resend: retrying a recall cannot email anyone twice. */
  idempotencyKey: string;
  requestId: string;
  feature: string;
};

export async function sendEmails(emails: OutgoingEmail[], options: SendOptions): Promise<SendSummary> {
  const config = serverConfig();
  const log = { feature: options.feature, action: "sendEmails", requestId: options.requestId };

  if (config.EMAIL_PROVIDER === "log") {
    for (const email of emails) logger.info("email (log only, not sent)", { ...log, to: maskEmail(email.to), subject: email.subject });
    return { sent: emails.length, failed: 0 };
  }
  if (!config.RESEND_API_KEY) throw new AppError("EMAIL_NOT_CONFIGURED");

  const resend = new Resend(config.RESEND_API_KEY);
  const from = config.EMAIL_FROM ?? "Rootline <onboarding@resend.dev>";
  const summary: SendSummary = { sent: 0, failed: 0 };

  for (const [index, chunk] of chunks(emails, BATCH_SIZE).entries()) {
    const { error } = await resend.batch.send(
      chunk.map((email) => ({ from, ...email })),
      { idempotencyKey: `${options.idempotencyKey}-${index}` },
    );
    if (error) {
      // Keep going: one failed batch should not stop the other recipients being warned.
      summary.failed += chunk.length;
      logger.error("email batch failed", { ...log, batch: index, count: chunk.length, error: error.message });
    } else {
      summary.sent += chunk.length;
    }
  }
  logger.info("emails sent", { ...log, ...summary });
  return summary;
}
