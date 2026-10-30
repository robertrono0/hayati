"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { first_name: form.first_name.trim(), last_name: form.last_name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/questionnaire`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) window.location.href = "/questionnaire";
    else setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="One more step.">
        <p className="text-sm text-ink/70">
          We sent a confirmation link to <strong>{form.email}</strong>. Click it to verify your email and start your questionnaire.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Apply" subtitle="Create your private account. Nobody else can see it.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="text-sm text-rose">{error}</p>}
        <button className="btn w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        <p className="text-center text-sm text-ink/60">
          Already applied? <Link href="/login" className="text-pine underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
