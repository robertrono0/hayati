"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sections, missingRequired, validationErrors, type Answers, type Question } from "@/lib/questionnaire";

export default function QuestionnaireForm({ userId, firstName, initial }: { userId: string; firstName: string; initial: Answers }) {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const section = sections[step];
  const isLast = step === sections.length - 1;
  const progress = Math.round(((step + 1) / sections.length) * 100);

  function set(id: string, v: Answers[string]) {
    setAnswers((a) => ({ ...a, [id]: v }));
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("questionnaire_responses")
      .upsert({ user_id: userId, answers }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setError("We couldn't save your answers. Check your connection and try again.");
      return false;
    }
    return true;
  }

  async function next() {
    setError("");
    const missing = missingRequired(answers, section);
    if (missing.length) return setError(`Please answer: ${missing.map((q) => q.label).join(", ")}`);
    const errs = validationErrors(answers);
    if (errs.length) return setError(errs.join(" "));
    if (!(await save())) return;
    if (!isLast) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // final submit
    const allMissing = missingRequired(answers);
    if (allMissing.length) return setError(`Some required questions are still empty: ${allMissing.map((q) => q.label).join(", ")}`);
    setSaving(true);
    const supabase = createClient();
    const phone = typeof answers.phone === "string" ? answers.phone : null;
    const { error: e1 } = await supabase
      .from("questionnaire_responses")
      .update({ answers, submitted_at: new Date().toISOString() })
      .eq("user_id", userId);
    const { error: e2 } = await supabase.from("profiles").update({ status: "submitted", phone }).eq("id", userId);
    setSaving(false);
    if (e1 || e2) return setError("Something went wrong submitting. Please try again.");
    window.location.href = "/dashboard?submitted=1";
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">
        Step {step + 1} of {sections.length}
      </p>
      <div className="mt-3 h-1 w-full rounded bg-sand">
        <div className="h-1 rounded bg-gold transition-all" style={{ width: `${progress}%` }} />
      </div>
      {step === 0 && firstName && <p className="mt-8 text-ink/70">Welcome, {firstName}. Take your time. Your answers save as you go.</p>}
      <h1 className="mt-6 font-serif text-4xl text-pine">{section.title}</h1>
      {section.intro && <p className="mt-2 text-sm text-ink/60">{section.intro}</p>}

      <div className="mt-8 space-y-8">
        {section.questions.map((q) => (
          <Field key={q.id} q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />
        ))}
      </div>

      {error && <p className="mt-6 rounded-lg bg-rose/10 p-3 text-sm text-rose">{error}</p>}

      <div className="mt-10 flex items-center justify-between">
        {step > 0 ? (
          <button className="btn-outline" onClick={() => { setError(""); setStep(step - 1); }} disabled={saving}>Back</button>
        ) : (
          <Link href="/dashboard" className="text-sm text-ink/60 underline">Finish later</Link>
        )}
        <button className="btn" onClick={next} disabled={saving}>
          {saving ? "Saving..." : isLast ? "Submit application" : "Save and continue"}
        </button>
      </div>
    </div>
  );
}

function Field({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: Answers[string]) => void }) {
  const label = (
    <label className="label">
      {q.label} {q.required && <span className="text-gold">*</span>}
      {q.help && <span className="mt-1 block text-xs font-normal text-ink/50">{q.help}</span>}
    </label>
  );

  if (q.type === "single") {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {q.options!.map((o) => (
            <button
              type="button"
              key={o}
              onClick={() => onChange(o)}
              className={`rounded-full border px-4 py-2 text-sm transition ${value === o ? "border-pine bg-pine text-ivory" : "border-sand bg-white hover:border-gold"}`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.type === "multi") {
    const arr = Array.isArray(value) ? value : [];
    const vertical = q.id === "consent";
    return (
      <div>
        {label}
        <div className={vertical ? "space-y-2" : "flex flex-wrap gap-2"}>
          {q.options!.map((o) => {
            const on = arr.includes(o);
            const toggle = () => onChange(on ? arr.filter((x) => x !== o) : [...arr, o]);
            return vertical ? (
              <label key={o} className="flex cursor-pointer items-start gap-3 rounded-lg border border-sand bg-white p-3 text-sm">
                <input type="checkbox" checked={on} onChange={toggle} className="mt-1 accent-pine" />
                <span>{o}</span>
              </label>
            ) : (
              <button
                type="button"
                key={o}
                onClick={toggle}
                className={`rounded-full border px-4 py-2 text-sm transition ${on ? "border-pine bg-pine text-ivory" : "border-sand bg-white hover:border-gold"}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "scale") {
    return (
      <div>
        {label}
        <div className="flex items-center gap-3">
          <span className="w-24 text-right text-xs text-ink/50">{q.scale![0]}</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => onChange(n)}
              className={`h-10 w-10 rounded-full border text-sm transition ${value === n ? "border-pine bg-pine text-ivory" : "border-sand bg-white hover:border-gold"}`}
            >
              {n}
            </button>
          ))}
          <span className="w-24 text-xs text-ink/50">{q.scale![1]}</span>
        </div>
      </div>
    );
  }

  if (q.type === "longtext") {
    return (
      <div>
        {label}
        <textarea className="input min-h-28" maxLength={2000} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  if (q.type === "number") {
    return (
      <div>
        {label}
        <input
          className="input max-w-32"
          type="number"
          min={q.min}
          max={q.max}
          value={(value as number | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        className="input"
        type={q.type === "date" ? "date" : "text"}
        maxLength={200}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
