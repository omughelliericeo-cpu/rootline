// Recall alert rules: the consent wording, unsubscribe codes, and building
// the recall email. Pure functions, unit tested.

/** Shown next to the sign-up box and stored with every subscription, word for word. */
export const RECALL_CONSENT_TEXT =
  "Email me only if this batch is recalled. My email is not shared or used for anything else, and I can unsubscribe at any time.";

/** A long random code (192 bits, 48 hex characters) for unsubscribe links; impossible to guess. */
export function newUnsubscribeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isUnsubscribeToken(value: string): boolean {
  return /^[0-9a-f]{48}$/.test(value);
}

/** Emails are compared lower-case so one person cannot be signed up twice. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

type RecallEmailInput = {
  brandName: string;
  batchName: string;
  subject: string;
  body: string;
  storyUrl: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
};

/**
 * The email one subscriber receives. Plain text plus simple HTML (no images,
 * so it is readable everywhere), and standard unsubscribe headers so mail
 * apps show their own "Unsubscribe" button.
 */
export function buildRecallEmail(input: RecallEmailInput) {
  const subject = `Recall: ${input.batchName} — ${input.subject}`;
  const text = [
    `${input.brandName} has issued a recall for ${input.batchName}.`,
    "",
    input.body,
    "",
    `Details: ${input.storyUrl}`,
    "",
    "You are receiving this because you asked to be told if this batch was recalled.",
    `Unsubscribe: ${input.unsubscribeUrl}`,
  ].join("\n");
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const html =
    `<div style="font-family:Georgia,serif;color:#2B2A26;max-width:560px">` +
    `<p style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#8A5A3B">Recall notice</p>` +
    `<h1 style="font-size:22px">${escapeHtml(input.brandName)} has issued a recall for ${escapeHtml(input.batchName)}</h1>` +
    paragraphs +
    `<p><a href="${escapeHtml(input.storyUrl)}">See the batch details</a></p>` +
    `<p style="font-size:12px;color:#6E685D">You asked to be told if this batch was recalled. ` +
    `<a href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe</a></p></div>`;
  return {
    subject,
    text,
    html,
    headers: {
      "List-Unsubscribe": `<${input.oneClickUnsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
