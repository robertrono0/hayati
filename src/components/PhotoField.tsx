"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/photos";

/** Shrinks any phone photo to a JPEG no wider than 1200px so uploads are fast and small. */
async function toJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("unreadable"));
      i.src = url;
    });
    const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("convert"))), "image/jpeg", 0.85)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PhotoField({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: string | undefined;
  onChange: (path: string | undefined) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // Show the saved photo when someone comes back to the questionnaire.
  useEffect(() => {
    if (!value || preview) return;
    createClient()
      .storage.from(PHOTO_BUCKET)
      .createSignedUrl(value, 60 * 60)
      .then(({ data }) => data?.signedUrl && setPreview(data.signedUrl));
  }, [value, preview]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Please choose a photo.");
    setBusy(true);
    try {
      const jpeg = await toJpeg(file);
      const path = `${userId}/face-${Date.now()}.jpg`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, jpeg, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      if (value && value !== path) await supabase.storage.from(PHOTO_BUCKET).remove([value]);
      setPreview(URL.createObjectURL(jpeg));
      onChange(path);
    } catch {
      setError("We couldn't upload that photo. Try a JPG or PNG, or take a new one.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sand bg-white">
        {preview ? (
          <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-ink/40">No photo</span>
        )}
      </div>
      <div>
        <input ref={input} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <button type="button" className="btn-outline !py-2" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Uploading..." : preview ? "Change photo" : "Upload photo"}
        </button>
        {error && <p className="mt-2 text-sm text-rose">{error}</p>}
      </div>
    </div>
  );
}
