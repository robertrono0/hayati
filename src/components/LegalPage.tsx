import Header from "@/components/Header";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <article className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-ink/80 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-pine [&_p]:mt-3 [&_li]:mt-1 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="font-serif text-4xl text-pine">{title}</h1>
        <p className="rounded-lg bg-gold/10 p-3 text-xs text-ink/70">Draft for review by a licensed attorney before launch.</p>
        {children}
      </article>
    </>
  );
}
