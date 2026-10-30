"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, flatten, memberStatuses, matchStatuses, busyMembers, fullName } from "@/lib/admin";
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

    const { data: allMatches } = await supabase.from("matches").select("member_a, member_b, status");
    const matches = allMatches ?? [];
    // Anyone already paired with this member, in ANY status (including rejected), is never suggested again.
    const already = new Set(
      matches
        .filter((m) => m.member_a === memberId || m.member_b === memberId)
        .map((m) => (m.member_a === memberId ? m.member_b : m.member_a))
    );
    // Anyone approved, contacted, introduced or dating with someone is off the market for now.
    const busy = busyMembers(matches);

    if (busy.has(memberId)) {
      msg = `${fullName(me)} is already in progress or dating with someone. Mark that match rejected or closed first to find new matches.`;
    } else {
    const pool = all.filter(
      (c) => c.id !== memberId && !already.has(c.id) && !busy.has(c.id) && hardFilter(me.answers, c.answers).length === 0
    );
    if (!pool.length) {
      msg = "No new compatible members right now. Everyone either fails a dealbreaker, was already suggested or rejected, or is busy with another match.";
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
    }
  } catch (e) {
    msg = `Error: ${e instanceof Error ? e.message : "Something went wrong."}`;
  }

  revalidatePath(back);
  redirect(`${back}?msg=${encodeURIComponent(msg)}`);
}

export async function sendCheckins(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const { emailConfigured, sendBatch, fillTemplate } = await import("@/lib/email");
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const mode = String(formData.get("mode") || "email");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  let msg = "";

  try {
    if (!ids.length) throw new Error("Select at least one member.");
    if (mode === "email") {
      if (!emailConfigured()) throw new Error("Email sending isn't set up yet. Use \"Send from my own email\" for now.");
      if (!subject || !body) throw new Error("The subject and message can't be empty.");
      const { data: people, error } = await supabase.from("profiles").select("id, email, first_name").in("id", ids);
      if (error) throw new Error(error.message);
      const withEmail = (people ?? []).filter((p) => p.email);
      await sendBatch(withEmail.map((p) => ({ to: p.email!, subject, text: fillTemplate(body, p.first_name) })));
      await supabase.from("followups").insert(withEmail.map((p) => ({ member_id: p.id, channel: "email", sent_by: user.id })));
      msg = `Sent ${withEmail.length} check-in${withEmail.length === 1 ? "" : "s"}.`;
    } else {
      await supabase.from("followups").insert(ids.map((id) => ({ member_id: id, channel: "manual", sent_by: user.id })));
      msg = `Marked ${ids.length} member${ids.length === 1 ? "" : "s"} as checked in.`;
    }
  } catch (e) {
    msg = `Error: ${e instanceof Error ? e.message : "Something went wrong."}`;
  }
  revalidatePath("/admin/checkins");
  redirect(`/admin/checkins?msg=${encodeURIComponent(msg)}`);
}
