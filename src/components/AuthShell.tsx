import Link from "next/link";
import { site } from "@/lib/config";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-10 text-center font-serif text-4xl text-pine">{site.name}</Link>
      <div className="card">
        <h1 className="font-serif text-3xl text-pine">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
