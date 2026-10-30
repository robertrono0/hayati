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

// ---------- Match stages ----------
/** Match statuses that mean a member is "taken" and shouldn't get new suggestions. */
export const busyStatuses = ["approved", "contacted", "introduced", "dating"];

export type Stage = "needs_match" | "in_progress" | "dating" | "not_ready";

export const stageLabels: Record<Stage, string> = {
  needs_match: "Needs a match",
  in_progress: "In progress",
  dating: "Dating",
  not_ready: "Not ready",
};

type MatchLite = { member_a: string; member_b: string; status: string };

/** Works out each member's stage from all their matches. */
export function stagesFor(members: { id: string; status: string }[], matches: MatchLite[]) {
  const byMember = new Map<string, string[]>();
  for (const m of matches) {
    for (const id of [m.member_a, m.member_b]) {
      byMember.set(id, [...(byMember.get(id) ?? []), m.status]);
    }
  }
  const out = new Map<string, Stage>();
  for (const mem of members) {
    const statuses = byMember.get(mem.id) ?? [];
    if (statuses.includes("dating")) out.set(mem.id, "dating");
    else if (statuses.some((s) => busyStatuses.includes(s))) out.set(mem.id, "in_progress");
    else if (["submitted", "active"].includes(mem.status)) out.set(mem.id, "needs_match");
    else out.set(mem.id, "not_ready");
  }
  return out;
}

/** Set of member ids currently in an approved/contacted/introduced/dating match. */
export function busyMembers(matches: MatchLite[], exceptMatchId?: string) {
  const s = new Set<string>();
  for (const m of matches as (MatchLite & { id?: string })[]) {
    if (m.id && m.id === exceptMatchId) continue;
    if (busyStatuses.includes(m.status)) {
      s.add(m.member_a);
      s.add(m.member_b);
    }
  }
  return s;
}

export const matchStatusLabels: Record<string, string> = {
  suggested: "Suggested",
  approved: "Approved",
  rejected: "Rejected (never re-match)",
  contacted: "Contacted",
  introduced: "Introduced",
  dating: "Dating",
  closed: "Closed",
};
