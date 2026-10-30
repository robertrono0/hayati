import Link from "next/link";
import Header from "@/components/Header";
import { site } from "@/lib/config";

const steps = [
  { n: "01", t: "Apply privately", d: "Fill out a thoughtful questionnaire about your background, faith, family and what you want. It takes about 20 minutes." },
  { n: "02", t: "We do the searching", d: "Our team reviews every member personally. No browsing, no swiping, and nobody can see your profile." },
  { n: "03", t: "A personal introduction", d: "When we find someone truly compatible, we reach out to both of you first. Only when you both agree do we introduce you." },
];

const promises = [
  { t: "Total discretion", d: "Your profile is never public. Not to other members, not to search engines, not to anyone outside our team." },
  { t: "Our community", d: "Built for Chaldean and Arab families in San Diego who value faith, family and serious intentions." },
  { t: "People, not algorithms", d: "Smart tools help us sort, but a real person reviews every single introduction before it happens." },
];

export default function Home() {
  return (
    <>
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gold">{site.city} · By introduction only</p>
        <h1 className="font-serif text-5xl leading-tight text-pine md:text-7xl">
          Meet the one,<br />the way family would.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">{site.tagline}</p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/signup" className="btn">Start your application</Link>
          <a href="#how" className="btn-outline">How it works</a>
        </div>
      </section>

      <section id="how" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center font-serif text-4xl text-pine">How it works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="card">
                <p className="font-serif text-4xl text-gold">{s.n}</p>
                <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-ink/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          {promises.map((p) => (
            <div key={p.t}>
              <div className="mb-4 h-px w-12 bg-gold" />
              <h3 className="font-serif text-2xl text-pine">{p.t}</h3>
              <p className="mt-2 text-sm text-ink/70">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-pine py-20 text-center text-ivory">
        <h2 className="font-serif text-4xl">Ready when you are.</h2>
        <p className="mt-3 text-ivory/70">Applying is free and completely confidential.</p>
        <Link href="/signup" className="mt-8 inline-flex rounded-full bg-gold px-8 py-3 text-sm font-medium text-ink hover:bg-ivory">Apply now</Link>
      </section>
    </>
  );
}
