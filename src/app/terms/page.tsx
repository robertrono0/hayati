import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/config";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <h2>Eligibility</h2>
      <p>You must be at least 18 years old, legally single, and provide truthful information.</p>
      <h2>Our service</h2>
      <p>{site.name} is a personal introduction service. We do not guarantee a match, a relationship, or marriage. We may decline or remove any membership at our discretion.</p>
      <h2>Your safety</h2>
      <p>We review members, but we do not run criminal background checks unless stated. Meet in public places and use your own judgment.</p>
      <h2>Conduct</h2>
      <p>Treat every introduction with respect. Sharing another member&apos;s information without consent is prohibited.</p>
      <h2>Contact</h2>
      <p><a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
    </LegalPage>
  );
}
