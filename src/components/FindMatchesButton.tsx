"use client";

import { useFormStatus } from "react-dom";

export default function FindMatchesButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn !py-2" disabled={disabled || pending}>
      {pending ? "Finding matches... (up to a minute)" : "✦ Find matches with AI"}
    </button>
  );
}
