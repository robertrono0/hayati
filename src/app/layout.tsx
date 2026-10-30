import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource-variable/inter";
import Link from "next/link";
import { site } from "@/lib/config";
import "./globals.css";


export const metadata: Metadata = {
  title: `${site.name} | Private introductions`,
  description: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-sand py-8 text-center text-xs text-ink/60">
          <p>
            © {new Date().getFullYear()} {site.name} ·{" "}
            <Link href="/privacy" className="underline">Privacy</Link> ·{" "}
            <Link href="/terms" className="underline">Terms</Link> ·{" "}
            <a href={`mailto:${site.contactEmail}`} className="underline">Contact</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
