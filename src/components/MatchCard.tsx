import Link from "next/link";
import Badge from "@/components/Badge";
import { setMatchStatus } from "@/app/admin/actions";
import { matchStatuses, matchStatusLabels } from "@/lib/admin";

export type MatchView = {
  id: string;
  score: number | null;
  ai_summary: string | null;
  ai_strengths: string | null;
  ai_concerns: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  people: { id: string; name: string; detail: string; busyElsewhere?: boolean }[];
};

export default function MatchCard({ m, back }: { m: MatchView; back: string }) {
  const score = m.score ?? 0;
  const ring = score >= 80 ? "border-pine text-pine" : score >= 60 ? "border-gold text-ink" : "border-rose/50 text-rose";
  return (
    <div className={`card ${m.status === "rejected" || m.status === "closed" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-5">
        <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 ${ring}`}>
          <span className="text-xl font-semibold">{m.score ?? "?"}</span>
          <span className="text-[10px] uppercase">score</span>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {m.people.map((p, i) => (
              <span key={p.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-gold">&amp;</span>}
                <Link href={`/admin/members/${p.id}`} className="font-medium text-pine hover:underline">{p.name}</Link>
                <span className="text-xs text-ink/50">{p.detail}</span>
              </span>
            ))}
            <Badge status={m.status} />
          </div>
          {m.status === "suggested" && m.people.filter((p) => p.busyElsewhere).map((p) => (
            <p key={p.id} className="mt-2 rounded-lg bg-gold/15 px-3 py-2 text-xs text-ink">
              ⚠ {p.name} is already in progress or dating with someone else. Hold off, or reject this suggestion.
            </p>
          ))}
          {m.status === "rejected" && <p className="mt-2 text-xs text-rose">Rejected. These two will never be suggested to each other again.</p>}
          {m.ai_summary && <p className="mt-2 text-sm text-ink/80">{m.ai_summary}</p>}
          <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
            <div>
              <p className="font-semibold text-pine">Strengths</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">{splitList(m.ai_strengths).map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold text-rose">Watch for</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">{splitList(m.ai_concerns).map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
          <form action={setMatchStatus} className="mt-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="back" value={back} />
            <select name="status" defaultValue={m.status} className="input !w-auto !py-2">
              {matchStatuses.map((s) => <option key={s} value={s}>{matchStatusLabels[s]}</option>)}
            </select>
            <input name="admin_notes" defaultValue={m.admin_notes ?? ""} placeholder="Private notes on this match" className="input !py-2 flex-1 min-w-48" />
            <button className="btn !py-2">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function splitList(t: string | null): string[] {
  if (!t) return [];
  // New AI notes use semicolons; older notes are one sentence, so keep them whole.
  if (!t.includes(";")) return [t];
  return t.split(";").map((x) => x.trim()).filter(Boolean);
}
