import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/env";

const BUCKET = "profile-covers";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const OK_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * Upload a profile cover photo to the Supabase `profile-covers` bucket and
 * return its public URL. Returns null when there's no real Supabase (stub/dev)
 * or on any validation/upload failure — the caller then just keeps the
 * previous cover. Uses the service-role client, which bypasses storage RLS.
 */
export async function uploadProfileCover(file: File, profileId: string): Promise<string | null> {
  if (!hasSupabase) return null;
  if (!file || file.size === 0 || file.size > MAX_BYTES) return null;
  if (file.type && !OK_TYPES.has(file.type)) return null;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${profileId}/cover-${Date.now()}.${ext}`;

  try {
    const sb = createSupabaseAdmin();
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (error) return null;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
