// Tests for recall rules: unsubscribe codes, emails and the consent wording.
import { describe, expect, it } from "vitest";
import { RECALL_CONSENT_TEXT, buildRecallEmail, escapeHtml, isUnsubscribeToken, newUnsubscribeToken, normaliseEmail } from "../service";

describe("unsubscribe tokens", () => {
  it("are long random hex codes, different every time", () => {
    const token = newUnsubscribeToken();
    expect(isUnsubscribeToken(token)).toBe(true);
    expect(newUnsubscribeToken()).not.toBe(token);
  });

  it("reject anything else", () => {
    expect(isUnsubscribeToken("abc")).toBe(false);
    expect(isUnsubscribeToken("x".repeat(48))).toBe(false);
  });
});

describe("emails", () => {
  it("compares addresses lower-case and trimmed", () => {
    expect(normaliseEmail("  Jess@Example.COM ")).toBe("jess@example.com");
  });

  it("states exactly what shoppers agree to", () => {
    expect(RECALL_CONSENT_TEXT).toMatch(/only if this batch is recalled/);
    expect(RECALL_CONSENT_TEXT).toMatch(/unsubscribe at any time/);
  });
});

describe("buildRecallEmail", () => {
  const email = buildRecallEmail({
    brandName: "Cedar & Tide",
    batchName: "Hazy Pale Ale, Brew 214",
    subject: "Possible glass in some cans",
    body: "Please do not drink it.\n\nReturn it to the store for a refund. <b>Thanks</b>",
    storyUrl: "https://rootline.app/b/cedarpm2",
    unsubscribeUrl: "https://rootline.app/recall/unsubscribe/abc",
    oneClickUnsubscribeUrl: "https://rootline.app/api/recall/unsubscribe/abc",
  });

  it("puts the batch and the problem in the subject", () => {
    expect(email.subject).toBe("Recall: Hazy Pale Ale, Brew 214 — Possible glass in some cans");
  });

  it("includes the message, the details link and the unsubscribe link in plain text", () => {
    expect(email.text).toContain("Return it to the store for a refund.");
    expect(email.text).toContain("Details: https://rootline.app/b/cedarpm2");
    expect(email.text).toContain("Unsubscribe: https://rootline.app/recall/unsubscribe/abc");
  });

  it("escapes the producer's text in the HTML version", () => {
    expect(email.html).toContain("Cedar &amp; Tide");
    expect(email.html).toContain("&lt;b&gt;Thanks&lt;/b&gt;");
    expect(email.html).not.toContain("<b>Thanks</b>");
  });

  it("adds standard one-click unsubscribe headers", () => {
    expect(email.headers).toEqual({
      "List-Unsubscribe": "<https://rootline.app/api/recall/unsubscribe/abc>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });

  it("escapes all HTML special characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});
