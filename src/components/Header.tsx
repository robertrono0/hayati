import Link from "next/link";
import { site } from "@/lib/config";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function Header() {
  const { user, profile } = await getSessionProfile();
  return (
    <header className="border-b border-sand bg-ivory/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-3xl tracking-wide text-pine">{site.name}</Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              {profile?.role === "admin" && <Link href="/admin" className="text-pine hover:underline">Admin</Link>}
              <Link href="/dashboard" className="text-pine hover:underline">My profile</Link>
              <form action="/auth/signout" method="post">
                <button className="text-ink/60 hover:underline">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-pine hover:underline">Sign in</Link>
              <Link href="/signup" className="btn !py-2">Apply</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
