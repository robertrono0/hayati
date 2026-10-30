import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/config";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we collect</h2>
      <p>Your name, email, phone, date of birth, and your questionnaire answers. Some answers, such as your background and faith, are sensitive personal information. You choose whether to share them.</p>
      <h2>How we use it</h2>
      <ul>
        <li>Only to find and arrange introductions for you.</li>
        <li>We use AI tools to help compare questionnaire answers. We do not send your name, email, phone or date of birth to these tools. A person on our team reviews every suggested match.</li>
        <li>We never sell your information or show your profile to other members or the public.</li>
      </ul>
      <h2>Who can see it</h2>
      <p>Only authorized members of the {site.name} team. When we propose an introduction, we share details with the other person only after you agree.</p>
      <h2>Your rights</h2>
      <p>California residents may request to know, correct, or delete their personal information, and limit the use of sensitive information. Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> and we will respond within 45 days.</p>
      <h2>Security and retention</h2>
      <p>Data is stored with encryption by our database provider. We keep it while your account is active and delete it on request.</p>
    </LegalPage>
  );
}
