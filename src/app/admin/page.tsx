import Link from "next/link";
import Badge from "@/components/Badge";
import { requireAdmin, flatten, fullName, memberStatuses } from "@/lib/admin";
import { ageFromDob } from "@/lib/questionnaire";

type SP = Promise<{ status?: string; gender?: string; background?: string; q?: string }>;

export default async function AdminMembers({ searchParams }: { searchParams: SP }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const { data } = await supabase
    .from("profiles")
    .select("*, questionnaire_responses(answers, submitted_at)")
    .eq("role", "member")
    .order("created_at", { ascending: false });

  const all = (data ?? []).map(flatten);
  const counts = Object.fromEntries(memberStatuses.map((s) => [s, all.filter((m) => m.status === s).length]));
  const backgrounds = [...new Set(all.map((m) => String(m.answers.background ?? "")).filter(Boolean))].sort();

  const q = (sp.q ?? "").toLowerCase();
  const members = all.filter(
    (m) =>
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

      <div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-6">
        {memberStatuses.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`card !p-4 hover:border-gold ${sp.status === s ? "border-gold" : ""}`}>
            <p className="text-2xl font-semibold text-pine">{counts[s]}</p>
            <p className="text-xs capitalize text-ink/60">{s}</p>
          </Link>
        ))}
      </div>

      <form className="mb-6 flex flex-wrap gap-3">
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
        <Link href="/admin" className="self-center text-sm text-ink/60 underline">Clear</Link>
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-sand/60 hover:bg-ivory">
                <td className="px-4 py-3">
                  <Link href={`/admin/members/${m.id}`} className="font-medium text-pine hover:underline">{fullName(m)}</Link>
                  <p className="text-xs text-ink/50">{String(m.answers.occupation ?? "")}</p>
                </td>
                <td className="px-4 py-3">{ageFromDob(m.answers.dob) ?? ""}</td>
                <td className="px-4 py-3">{String(m.answers.gender ?? "")}</td>
                <td className="px-4 py-3">{String(m.answers.background ?? "")}</td>
                <td className="px-4 py-3">{String(m.answers.religion ?? "")}</td>
                <td className="px-4 py-3">{String(m.answers.area ?? "")}</td>
                <td className="px-4 py-3"><Badge status={m.status} /></td>
                <td className="px-4 py-3 text-ink/60">{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!members.length && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-ink/50">No members match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
