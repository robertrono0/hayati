import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { site } from "@/lib/config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <div className="min-h-screen bg-ivory">
      <header className="bg-pine text-ivory">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-serif text-2xl">{site.name} <span className="text-sm text-gold">Team</span></Link>
            <nav className="flex gap-5 text-sm">
              <Link href="/admin" className="hover:text-gold">Members</Link>
              <Link href="/admin/matches" className="hover:text-gold">Matches</Link>
              <Link href="/admin/checkins" className="hover:text-gold">Check-ins</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-ivory/70">
            <span>{profile?.first_name}</span>
            <form action="/auth/signout" method="post"><button className="hover:text-gold">Sign out</button></form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
