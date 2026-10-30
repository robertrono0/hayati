import type { SupabaseClient } from "@supabase/supabase-js";

export const PHOTO_BUCKET = "photos";

/** Signed, short-lived links for a list of private photo paths. */
export async function signedPhotoUrls(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const clean = [...new Set(paths.filter((p): p is string => typeof p === "string" && p.length > 0))];
  const out = new Map<string, string>();
  if (!clean.length) return out;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(clean, 60 * 60);
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  return out;
}

export function photoPath(answers: Record<string, unknown>): string | null {
  return typeof answers.photo === "string" && answers.photo ? answers.photo : null;
}
