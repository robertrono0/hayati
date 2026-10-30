import Link from "next/link";
import Badge from "@/components/Badge";
import { setMatchStatus } from "@/app/admin/actions";
import { matchStatuses } from "@/lib/admin";

export type MatchView = {
  id: string;
  score: number | null;
  ai_summary: string | null;
  ai_strengths: string | null;
  ai_concerns: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  people: { id: string; name: string; detail: string }[];
};

export default function MatchCard({ m, back }: { m: MatchView; back: string }) {
  const score = m.score ?? 0;
  const ring = score >= 80 ? "border-pine text-pine" : score >= 60 ? "border-gold text-ink" : "border-rose/50 text-rose";
  return (
    <div className="card">
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
          {m.ai_summary && <p className="mt-2 text-sm text-ink/80">{m.ai_summary}</p>}
          <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
            <p><span className="font-semibold text-pine">Strengths: </span>{m.ai_strengths}</p>
            <p><span className="font-semibold text-rose">Watch for: </span>{m.ai_concerns}</p>
          </div>
          <form action={setMatchStatus} className="mt-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="back" value={back} />
            <select name="status" defaultValue={m.status} className="input !w-auto !py-2">
              {matchStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input name="admin_notes" defaultValue={m.admin_notes ?? ""} placeholder="Private notes on this match" className="input !py-2 flex-1 min-w-48" />
            <button className="btn !py-2">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
}
