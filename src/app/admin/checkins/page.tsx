import Link from "next/link";
import Avatar from "@/components/Avatar";
import { sendCheckins } from "@/app/admin/actions";
import { requireAdmin, flatten, fullName, stagesFor } from "@/lib/admin";
import { defaultCheckin, emailConfigured, fillTemplate } from "@/lib/email";
import { signedPhotoUrls, photoPath } from "@/lib/photos";

const DAY = 864e5;
const DUE_AFTER_DAYS = 7;

export default async function CheckinsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { supabase } = await requireAdmin();
  const { msg } = await searchParams;

  const [{ data: rows }, { data: matchRows }, { data: fu, error: fuErr }] = await Promise.all([
    supabase.from("profiles").select("*, questionnaire_responses(answers, submitted_at)").eq("role", "member"),
    supabase.from("matches").select("member_a, member_b, status"),
    supabase.from("followups").select("member_id, sent_at").order("sent_at", { ascending: false }),
  ]);

  const all = (rows ?? []).map(flatten);
  const stages = stagesFor(all, matchRows ?? []);
  const last = new Map<string, string>();
  for (const f of fu ?? []) if (!last.has(f.member_id)) last.set(f.member_id, f.sent_at);

  const now = Date.now();
  const waiting = all
    .filter((m) => stages.get(m.id) === "needs_match")
    .map((m) => {
      const l = last.get(m.id);
      const days = l ? Math.floor((now - Date.parse(l)) / DAY) : null;
      return { m, l, days, due: days === null || days >= DUE_AFTER_DAYS };
    })
    .sort((a, b) => Number(b.due) - Number(a.due) || (b.days ?? 999) - (a.days ?? 999));

  const due = waiting.filter((w) => w.due);
  const photos = await signedPhotoUrls(supabase, waiting.map((w) => photoPath(w.m.answers)));
  const configured = emailConfigured();

  const bcc = due.map((w) => w.m.email).filter(Boolean).join(",");
  const mailto = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(defaultCheckin.subject)}&body=${encodeURIComponent(fillTemplate(defaultCheckin.body, null))}`;

  return (
    <div>
      <h1 className="font-serif text-4xl text-pine">Weekly check-ins</h1>
      <p className="text-sm text-ink/60">
        Let members who are still waiting know you haven&apos;t forgotten them. {due.length} of {waiting.length} waiting members are due (no check-in in {DUE_AFTER_DAYS} days).
      </p>

      {fuErr && (
        <p className="mt-6 rounded-lg bg-rose/10 p-3 text-sm text-rose">
          Check-ins aren&apos;t set up in the database yet. Run <code>supabase/followups.sql</code> in the Supabase SQL Editor, then refresh.
        </p>
      )}
      {msg && <p className={`mt-6 rounded-lg p-3 text-sm ${msg.startsWith("Error") ? "bg-rose/10 text-rose" : "bg-pine/10 text-pine"}`}>{msg}</p>}
      {!configured && (
        <p className="mt-6 rounded-lg bg-gold/15 p-3 text-sm text-ink">
          Automatic email isn&apos;t connected yet, so use <strong>Send from my own email</strong> below. It opens your email app with everyone due in BCC. Then click <strong>Mark as checked in</strong>.
        </p>
      )}

      <form action={sendCheckins} className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card !p-0">
            <div className="border-b border-sand px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink/60">Members waiting for a match</div>
            <ul className="max-h-[560px] divide-y divide-sand/60 overflow-y-auto">
              {waiting.map(({ m, days, due: isDue }) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-ivory">
                    <input type="checkbox" name="ids" value={m.id} defaultChecked={isDue} className="accent-pine" />
                    <Avatar url={photos.get(photoPath(m.answers) ?? "")} name={fullName(m)} size={32} />
                    <span className="flex-1">
                      <Link href={`/admin/members/${m.id}`} className="text-sm font-medium text-pine hover:underline">{fullName(m)}</Link>
                      <span className="block text-xs text-ink/50">{m.email}</span>
                    </span>
                    <span className={`text-xs ${isDue ? "font-medium text-gold" : "text-ink/40"}`}>
                      {days === null ? "Never" : days === 0 ? "Today" : `${days}d ago`}
                    </span>
                  </label>
                </li>
              ))}
              {!waiting.length && <li className="px-4 py-8 text-center text-sm text-ink/50">Nobody is waiting right now.</li>}
            </ul>
          </div>
        </div>

        <div className="card lg:col-span-3">
          <label className="label">Subject</label>
          <input name="subject" defaultValue={defaultCheckin.subject} className="input" />
          <label className="label mt-4">Message</label>
          <textarea name="body" defaultValue={defaultCheckin.body} className="input min-h-80 font-serif text-base leading-relaxed" />
          <p className="mt-2 text-xs text-ink/50">{"{first_name}"} is replaced with each person&apos;s first name. Each person gets their own private email.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button name="mode" value="email" className="btn" disabled={!configured}>Send check-in to selected</button>
            <a href={mailto} className="btn-outline">Send from my own email</a>
            <button name="mode" value="manual" className="text-sm text-ink/60 underline">Mark as checked in</button>
          </div>
          <p className="mt-3 text-xs text-ink/40">&quot;Send from my own email&quot; uses the standard message, addressed to everyone due, in BCC so nobody sees anyone else.</p>
        </div>
      </form>
    </div>
  );
}
