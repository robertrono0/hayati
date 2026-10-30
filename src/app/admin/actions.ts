"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, flatten, memberStatuses, matchStatuses } from "@/lib/admin";
import { aiReview, hardFilter, quickScore } from "@/lib/matching";

const SHORTLIST = 8;

export async function setMemberStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!memberStatuses.includes(status as (typeof memberStatuses)[number])) return;
  await supabase.from("profiles").update({ status }).eq("id", id);
  revalidatePath(`/admin/members/${id}`);
  revalidatePath("/admin");
}

export async function addNote(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  await supabase.from("member_notes").insert({ member_id: id, author_id: user.id, note });
  revalidatePath(`/admin/members/${id}`);
}

export async function unlockQuestionnaire(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  await supabase.from("questionnaire_responses").update({ submitted_at: null }).eq("user_id", id);
  await supabase.from("profiles").update({ status: "draft" }).eq("id", id);
  revalidatePath(`/admin/members/${id}`);
}

export async function setMatchStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const back = String(formData.get("back") || "/admin/matches");
  if (!matchStatuses.includes(status as (typeof matchStatuses)[number])) return;
  const notes = formData.get("admin_notes");
  await supabase
    .from("matches")
    .update({ status, ...(notes !== null ? { admin_notes: String(notes) } : {}), updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(back);
  revalidatePath("/admin/matches");
}

export async function findMatches(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const memberId = String(formData.get("id"));
  const back = `/admin/members/${memberId}`;
  let msg = "";

  try {
    const { data: rows, error } = await supabase
      .from("profiles")
      .select("*, questionnaire_responses(answers, submitted_at)")
      .eq("role", "member")
      .in("status", ["submitted", "active"]);
    if (error) throw new Error(error.message);

    const all = (rows ?? []).map(flatten).filter((m) => m.submitted_at);
    const { data: meRow } = await supabase
      .from("profiles")
      .select("*, questionnaire_responses(answers, submitted_at)")
      .eq("id", memberId)
      .single();
    if (!meRow) throw new Error("Member not found.");
    const me = flatten(meRow);
    if (!me.submitted_at) throw new Error("This member hasn't submitted their questionnaire yet.");

    const { data: existing } = await supabase
      .from("matches")
      .select("member_a, member_b")
      .or(`member_a.eq.${memberId},member_b.eq.${memberId}`);
    const already = new Set((existing ?? []).map((m) => (m.member_a === memberId ? m.member_b : m.member_a)));

    const pool = all.filter((c) => c.id !== memberId && !already.has(c.id) && hardFilter(me.answers, c.answers).length === 0);
    if (!pool.length) {
      msg = "No new compatible members right now. Everyone either fails a dealbreaker or was already suggested.";
    } else {
      const shortlist = pool
        .map((c) => ({ c, q: quickScore(me.answers, c.answers) }))
        .sort((x, y) => y.q - x.q)
        .slice(0, SHORTLIST)
        .map((x) => x.c);

      const results = await aiReview({ id: me.id, answers: me.answers }, shortlist);
      const inserts = shortlist
        .filter((c) => results.has(c.id))
        .map((c) => {
          const r = results.get(c.id)!;
          return {
            member_a: memberId,
            member_b: c.id,
            score: r.score,
            ai_summary: r.summary,
            ai_strengths: r.strengths,
            ai_concerns: r.concerns,
            created_by: user.id,
          };
        });
      if (inserts.length) {
        const { error: insErr } = await supabase.from("matches").insert(inserts);
        if (insErr) throw new Error(insErr.message);
      }
      msg = `Found ${inserts.length} suggestion${inserts.length === 1 ? "" : "s"} from ${pool.length} compatible member${pool.length === 1 ? "" : "s"}.`;
    }
  } catch (e) {
    msg = `Error: ${e instanceof Error ? e.message : "Something went wrong."}`;
  }

  revalidatePath(back);
  redirect(`${back}?msg=${encodeURIComponent(msg)}`);
}
