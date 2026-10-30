"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setMsg("Password must be at least 8 characters.");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) return setMsg(error.message);
    window.location.href = "/dashboard";
  }
  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg && <p className="text-sm text-rose">{msg}</p>}
        <button className="btn w-full">Save password</button>
      </form>
    </AuthShell>
  );
}
