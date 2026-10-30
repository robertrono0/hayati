import { site } from "@/lib/config";

export const defaultCheckin = {
  subject: `A quick update from ${site.name}`,
  body: `Hi {first_name},

Just a quick note to let you know we haven't forgotten about you. Our team is still personally reviewing new members and looking for someone who is truly right for you.

When we find a strong match, we'll reach out to you privately first, before anything else happens.

If anything has changed (a new phone number, you've met someone, or you'd like to pause for now), just reply to this email.

Warmly,
The ${site.name} Team`,
};

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function fillTemplate(text: string, firstName: string | null) {
  return text.replace(/\{first_name\}/g, firstName?.trim() || "there");
}

function toHtml(text: string) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 16px">${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1d2420;max-width:560px">${paras}</div>`;
}

/** Sends one personalized email per person through Resend (max 100 per call). */
export async function sendBatch(messages: { to: string; subject: string; text: string }[]) {
  const key = process.env.RESEND_API_KEY!;
  const from = process.env.EMAIL_FROM!;
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
  const sent: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(
        chunk.map((m) => ({ from, to: [m.to], subject: m.subject, text: m.text, html: toHtml(m.text), ...(replyTo ? { reply_to: replyTo } : {}) }))
      ),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Email service error (${res.status}). ${detail.slice(0, 200)}`);
    }
    sent.push(...chunk.map((m) => m.to));
  }
  return sent;
}
