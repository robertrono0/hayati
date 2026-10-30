import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import type { Answers } from "@/lib/questionnaire";

export async function requireAdmin() {
  const ctx = await getSessionProfile();
  if (!ctx.user) redirect("/login?next=/admin");
  if (ctx.profile?.role !== "admin") redirect("/dashboard");
  return ctx as typeof ctx & { user: NonNullable<typeof ctx.user> };
}

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
};

export type MemberRow = Profile & { answers: Answers; submitted_at: string | null };

type Raw = Profile & { questionnaire_responses: { answers: Answers; submitted_at: string | null } | { answers: Answers; submitted_at: string | null }[] | null };

export function flatten(r: Raw): MemberRow {
  const qr = Array.isArray(r.questionnaire_responses) ? r.questionnaire_responses[0] : r.questionnaire_responses;
  return { ...r, answers: qr?.answers ?? {}, submitted_at: qr?.submitted_at ?? null };
}

export const memberStatuses = ["draft", "submitted", "active", "paused", "matched", "declined"] as const;
export const matchStatuses = ["suggested", "approved", "rejected", "contacted", "introduced", "dating", "closed"] as const;

export const statusColor: Record<string, string> = {
  draft: "bg-sand text-ink/70",
  submitted: "bg-gold/20 text-ink",
  active: "bg-pine/15 text-pine",
  paused: "bg-sand text-ink/70",
  matched: "bg-pine text-ivory",
  declined: "bg-rose/15 text-rose",
  suggested: "bg-gold/20 text-ink",
  approved: "bg-pine/15 text-pine",
  rejected: "bg-rose/15 text-rose",
  contacted: "bg-pine/25 text-pine",
  introduced: "bg-pine/40 text-ink",
  dating: "bg-pine text-ivory",
  closed: "bg-sand text-ink/70",
};

export function fullName(p: Pick<Profile, "first_name" | "last_name">) {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
}
