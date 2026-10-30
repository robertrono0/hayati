import { redirect } from "next/navigation";
import Header from "@/components/Header";
import QuestionnaireForm from "@/components/QuestionnaireForm";
import { getSessionProfile } from "@/lib/supabase/server";
import type { Answers } from "@/lib/questionnaire";

export default async function QuestionnairePage() {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect("/login?next=/questionnaire");
  const { data } = await supabase
    .from("questionnaire_responses")
    .select("answers, submitted_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data?.submitted_at) redirect("/dashboard");
  return (
    <>
      <Header />
      <QuestionnaireForm userId={user.id} firstName={profile?.first_name ?? ""} initial={(data?.answers as Answers) ?? {}} />
    </>
  );
}
