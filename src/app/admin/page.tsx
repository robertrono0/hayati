import Link from "next/link";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import { signedPhotoUrls, photoPath } from "@/lib/photos";
import { requireAdmin, flatten, fullName, memberStatuses, stagesFor, stageLabels, type Stage } from "@/lib/admin";
import { ageFromDob } from "@/lib/questionnaire";

type SP = Promise<{ view?: string; status?: string; gender?: string; background?: string; q?: string }>;

const stageStyle: Record<Stage, string> = {
  needs_match: "bg-gold/20 text-ink",
  in_progress: "bg-pine/20 text-pine",
  dating: "bg-pine text-ivory",
  not_ready: "bg-sand text-ink/60",
};

export default async function AdminMembers({ searchParams }: { searchParams: SP }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const { data } = await supabase
    .from("profiles")
    .select("*, questionnaire_responses(answers, submitted_at)")
    .eq("role", "member")
    .order("created_at", { ascending: false });

  const all = (data ?? []).map(flatten);
  const { data: matchRows } = await supabase.from("matches").select("member_a, member_b, status");
  const stages = stagesFor(all, matchRows ?? []);
  const photos = await signedPhotoUrls(supabase, all.map((m) => photoPath(m.answers)));
  const views: { key: Stage | "all"; label: string; hint: string }[] = [
    { key: "needs_match", label: "Needs a match", hint: "Ready, nobody approved yet" },
    { key: "in_progress", label: "In progress", hint: "Approved, contacted or introduced" },
    { key: "dating", label: "Dating", hint: "Currently seeing someone" },
    { key: "all", label: "All members", hint: "Including drafts and paused" },
  ];
  const view = (sp.view ?? "all") as Stage | "all";
  const viewCount = (k: Stage | "all") => (k === "all" ? all.length : all.filter((m) => stages.get(m.id) === k).length);
  const backgrounds = [...new Set(all.map((m) => String(m.answers.background ?? "")).filter(Boolean))].sort();

  const q = (sp.q ?? "").toLowerCase();
  const members = all.filter(
    (m) =>
      (view === "all" || stages.get(m.id) === view) &&
      (!sp.status || m.status === sp.status) &&
      (!sp.gender || m.answers.gender === sp.gender) &&
      (!sp.background || m.answers.background === sp.background) &&
      (!q || `${fullName(m)} ${m.email} ${m.answers.occupation ?? ""}`.toLowerCase().includes(q))
  );

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl text-pine">Members</h1>
          <p className="text-sm text-ink/60">{all.length} total</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {views.map((v) => (
          <Link key={v.key} href={`/admin?view=${v.key}`} className={`card !p-4 transition hover:border-gold ${view === v.key ? "!border-pine ring-1 ring-pine" : ""}`}>
            <p className="text-3xl font-semibold text-pine">{viewCount(v.key)}</p>
            <p className="text-sm font-medium">{v.label}</p>
            <p className="text-xs text-ink/50">{v.hint}</p>
          </Link>
        ))}
      </div>

      <form className="mb-6 flex flex-wrap gap-3">
        <input type="hidden" name="view" value={view} />
        <input name="q" defaultValue={sp.q} placeholder="Search name, email, job" className="input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-40">
          <option value="">All statuses</option>
          {memberStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="gender" defaultValue={sp.gender ?? ""} className="input max-w-36">
          <option value="">All genders</option>
          <option>Man</option>
          <option>Woman</option>
        </select>
        <select name="background" defaultValue={sp.background ?? ""} className="input max-w-44">
          <option value="">All backgrounds</option>
          {backgrounds.map((b) => <option key={b}>{b}</option>)}
        </select>
        <button className="btn !py-2">Filter</button>
        <Link href={`/admin?view=${view}`} className="self-center text-sm text-ink/60 underline">Clear</Link>
      </form>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sand bg-sand/40 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Background</th>
              <th className="px-4 py-3">Faith</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Match stage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-sand/60 hover:bg-ivory">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={photos.get(photoPath(m.answers) ?? "")} name={fullName(m)} size={44} />
                    <div>
                      <Link href={`/admin/members/${m.id}`} className="font-medium text-pine hover:underline">{fullName(m)}</Link>
                      <p className="text-xs text-ink/50">{String(m.answers.occupation ?? "")}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{ageFromDob(m.answers.dob) ?? ""}</td>
                <td className="px-4 py-3">{String(m.answers.gender ?? "")}</td>
                <td className="px-4 py-3">{String(m.answers.background ?? "")}</td>
                <td className="px-4 py-3">{String(m.answers.religion ?? "")}</td>
                <td className="px-4 py-3">{String(m.answers.area ?? "")}</td>
                <td className="px-4 py-3">
                  {(() => { const st = stages.get(m.id) ?? "not_ready"; return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stageStyle[st]}`}>{stageLabels[st]}</span>; })()}
                </td>
                <td className="px-4 py-3"><Badge status={m.status} /></td>
                <td className="px-4 py-3 text-ink/60">{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!members.length && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-ink/50">No members match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
