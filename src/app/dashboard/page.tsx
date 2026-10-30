import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getSessionProfile } from "@/lib/supabase/server";
import { site } from "@/lib/config";

const messages: Record<string, { title: string; body: string }> = {
  draft: { title: "Your application isn't finished yet", body: "Pick up where you left off. Your answers are saved." },
  submitted: { title: "Application received", body: "Thank you. Our team is personally reviewing your profile. We'll be in touch by phone or email." },
  active: { title: "You're an active member", body: "We're actively searching for someone right for you. When we find a strong match, we'll contact you privately before anything else happens." },
  paused: { title: "Your profile is paused", body: "We won't suggest any introductions while you're paused. Contact us whenever you're ready to resume." },
  matched: { title: "We have an introduction for you", body: "Watch for a call or email from our team. We'll share details privately and only with your agreement." },
  declined: { title: "Thank you for applying", body: "We aren't able to offer membership at this time. Please contact us if you have questions." },
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");
  const { submitted } = await searchParams;
  const m = messages[profile.status] ?? messages.submitted;

  return (
    <>
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Your profile</p>
        <h1 className="mt-2 font-serif text-4xl text-pine">Hello, {profile.first_name || "there"}</h1>
        {submitted && <p className="mt-4 rounded-lg bg-pine/10 p-3 text-sm text-pine">Your application was submitted successfully.</p>}
        <div className="card mt-8">
          <h2 className="font-serif text-2xl text-pine">{m.title}</h2>
          <p className="mt-2 text-sm text-ink/70">{m.body}</p>
          {profile.status === "draft" && (
            <Link href="/questionnaire" className="btn mt-6">Continue application</Link>
          )}
        </div>
        <p className="mt-8 text-sm text-ink/60">
          Need to update something or pause your profile? Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </div>
    </>
  );
}
