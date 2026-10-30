import Link from "next/link";
import MatchCard, { type MatchView } from "@/components/MatchCard";
import { signedPhotoUrls, photoPath } from "@/lib/photos";
import { requireAdmin, flatten, fullName, matchStatuses, matchStatusLabels, busyMembers } from "@/lib/admin";
import { ageFromDob } from "@/lib/questionnaire";

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const { status } = await searchParams;

  let query = supabase.from("matches").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  const { data: matches } = await query;
  const { data: all } = await supabase.from("matches").select("id, member_a, member_b, status");

  const ids = [...new Set((matches ?? []).flatMap((m) => [m.member_a, m.member_b]))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("*, questionnaire_responses(answers, submitted_at)").in("id", ids)
    : { data: [] };
  const map = new Map((people ?? []).map((p) => { const f = flatten(p); return [f.id, f]; }));

  const photos = await signedPhotoUrls(supabase, [...map.values()].map((p) => photoPath(p.answers)));

  const views: MatchView[] = (matches ?? []).map((m) => ({
    ...m,
    people: [m.member_a, m.member_b].map((pid: string) => {
      const p = map.get(pid);
      return p
        ? {
            id: p.id,
            name: fullName(p),
            detail: [ageFromDob(p.answers.dob), p.answers.background].filter(Boolean).join(" · "),
            busyElsewhere: busyMembers(all ?? [], m.id).has(p.id),
            photoUrl: photos.get(photoPath(p.answers) ?? "") ?? null,
          }
        : { id: pid, name: "(removed)", detail: "" };
    }),
  }));

  const counts = Object.fromEntries(matchStatuses.map((s) => [s, (all ?? []).filter((m) => m.status === s).length]));

  return (
    <div>
      <h1 className="font-serif text-4xl text-pine">Matches</h1>
      <p className="text-sm text-ink/60">Every AI suggestion and introduction, in one pipeline.</p>
      <div className="my-6 flex flex-wrap gap-2">
        <Link href="/admin/matches" className={`rounded-full border px-4 py-1.5 text-sm ${!status ? "border-pine bg-pine text-ivory" : "border-sand bg-white"}`}>All</Link>
        {matchStatuses.map((s) => (
          <Link key={s} href={`/admin/matches?status=${s}`} className={`rounded-full border px-4 py-1.5 text-sm capitalize ${status === s ? "border-pine bg-pine text-ivory" : "border-sand bg-white"}`}>
            {matchStatusLabels[s].replace(" (never re-match)", "")} <span className="text-xs opacity-60">{counts[s]}</span>
          </Link>
        ))}
      </div>
      <div className="space-y-4">
        {views.map((v) => <MatchCard key={v.id} m={v} back="/admin/matches" />)}
        {!views.length && <p className="card text-center text-sm text-ink/50">No matches here yet. Open a member and click “Find matches with AI.”</p>}
      </div>
    </div>
  );
}
