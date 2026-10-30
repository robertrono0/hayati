import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import MatchCard, { type MatchView } from "@/components/MatchCard";
import FindMatchesButton from "@/components/FindMatchesButton";
import { addNote, findMatches, setMemberStatus, unlockQuestionnaire } from "@/app/admin/actions";
import { requireAdmin, flatten, fullName, memberStatuses } from "@/lib/admin";
import { ageFromDob, sections } from "@/lib/questionnaire";
import { displayAnswer } from "@/lib/matching";

export const maxDuration = 60;

export default async function MemberDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { msg } = await searchParams;

  const { data: row } = await supabase.from("profiles").select("*, questionnaire_responses(answers, submitted_at)").eq("id", id).single();
  if (!row) notFound();
  const m = flatten(row);

  const [{ data: notes }, { data: matches }] = await Promise.all([
    supabase.from("member_notes").select("*").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("matches").select("*").or(`member_a.eq.${id},member_b.eq.${id}`).order("score", { ascending: false }),
  ]);

  const otherIds = (matches ?? []).map((x) => (x.member_a === id ? x.member_b : x.member_a));
  const { data: others } = otherIds.length
    ? await supabase.from("profiles").select("*, questionnaire_responses(answers, submitted_at)").in("id", otherIds)
    : { data: [] };
  const otherMap = new Map((others ?? []).map((o) => { const f = flatten(o); return [f.id, f]; }));

  const matchViews: MatchView[] = (matches ?? []).map((x) => {
    const o = otherMap.get(x.member_a === id ? x.member_b : x.member_a);
    return {
      ...x,
      people: o ? [{ id: o.id, name: fullName(o), detail: [ageFromDob(o.answers.dob), o.answers.background, o.answers.area].filter(Boolean).join(" · ") }] : [],
    };
  });

  const age = ageFromDob(m.answers.dob);

  return (
    <div>
      <Link href="/admin" className="text-sm text-ink/60 underline">← All members</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-pine">{fullName(m)}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {[age && `${age} years old`, m.answers.gender, m.answers.background, m.answers.religion, m.answers.area].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-sm text-ink/60">{m.email} · {m.phone || String(m.answers.phone ?? "")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={m.status} />
          <form action={setMemberStatus} className="flex gap-2">
            <input type="hidden" name="id" value={m.id} />
            <select name="status" defaultValue={m.status} className="input !w-auto !py-2">
              {memberStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-outline !py-2">Update</button>
          </form>
        </div>
      </div>

      {msg && <p className={`mt-6 rounded-lg p-3 text-sm ${msg.startsWith("Error") ? "bg-rose/10 text-rose" : "bg-pine/10 text-pine"}`}>{msg}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-pine">Matches</h2>
            <form action={findMatches}>
              <input type="hidden" name="id" value={m.id} />
              <FindMatchesButton disabled={!m.submitted_at} />
            </form>
          </div>
          {!m.submitted_at && <p className="text-sm text-ink/60">Matching unlocks once this member submits their questionnaire.</p>}
          {matchViews.map((mv) => <MatchCard key={mv.id} m={mv} back={`/admin/members/${id}`} />)}
          {m.submitted_at && !matchViews.length && <p className="text-sm text-ink/60">No suggestions yet. Click “Find matches” to run the AI.</p>}

          <h2 className="pt-4 font-serif text-2xl text-pine">Questionnaire</h2>
          {!m.submitted_at && <p className="text-sm text-gold">Not submitted yet. Showing saved answers so far.</p>}
          {sections.map((s) => (
            <div key={s.id} className="card">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">{s.title}</h3>
              <dl className="grid gap-x-6 gap-y-3 text-sm md:grid-cols-2">
                {s.questions.map((q) => {
                  const v = displayAnswer(q.id, m.answers[q.id]);
                  const long = q.type === "longtext";
                  return (
                    <div key={q.id} className={long ? "md:col-span-2" : ""}>
                      <dt className="text-xs text-ink/50">{q.label}</dt>
                      <dd className={`whitespace-pre-wrap ${v ? "" : "text-ink/30"}`}>{v || "No answer"}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
          {m.submitted_at && (
            <form action={unlockQuestionnaire}>
              <input type="hidden" name="id" value={m.id} />
              <button className="text-xs text-ink/50 underline">Unlock questionnaire so the member can edit it</button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-6">
            <h2 className="font-serif text-2xl text-pine">Private notes</h2>
            <p className="text-xs text-ink/50">Only your team sees these.</p>
            <form action={addNote} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={m.id} />
              <textarea name="note" required className="input min-h-24" placeholder="Phone call notes, family details, impressions..." />
              <button className="btn !py-2">Add note</button>
            </form>
            <ul className="mt-6 space-y-4">
              {(notes ?? []).map((n) => (
                <li key={n.id} className="border-l-2 border-gold pl-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.note}</p>
                  <p className="mt-1 text-xs text-ink/40">{new Date(n.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
