import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/env";

const BUCKET = "brand-logos";
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const OK_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

/**
 * Upload a brand logo to the Supabase `brand-logos` bucket and return its public
 * URL. Returns null when there's no real Supabase (stub/dev) or on any
 * validation/upload failure — the caller then just keeps the previous logo.
 * Uses the service-role client, which bypasses storage RLS.
 */
export async function uploadBrandLogo(file: File, profileId: string): Promise<string | null> {
  if (!hasSupabase) return null;
  if (!file || file.size === 0 || file.size > MAX_BYTES) return null;
  if (file.type && !OK_TYPES.has(file.type)) return null;

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${profileId}/logo-${Date.now()}.${ext}`;

  try {
    const sb = createSupabaseAdmin();
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/png",
      upsert: true,
    });
    if (error) return null;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
