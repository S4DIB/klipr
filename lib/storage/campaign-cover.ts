import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/env";
import { classifyCover } from "@/lib/media/cover";

const BUCKET = "campaign-covers";

/**
 * Store a campaign cover — a picture OR a video — and return its public URL.
 *
 * With Supabase configured the file lands in the public `campaign-covers`
 * bucket via the service-role client (bypasses storage RLS). In stub/dev mode
 * there is no bucket, so it's written under `public/uploads/campaign-covers/`
 * and served by Next as a static file — that keeps the whole flow testable
 * locally. Returns null on any validation or write failure; the caller then
 * keeps whatever cover the campaign already had.
 *
 * The extension is preserved because CampaignCover picks image vs. video off
 * the URL — a stored file with no usable extension would render as a broken
 * <img>.
 */
export async function uploadCampaignCover(
  file: File,
  campaignId: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const cls = classifyCover(file.type);
  if (!cls || file.size > cls.max) return null;

  const filename = `cover-${Date.now()}.${cls.ext}`;

  if (!hasSupabase) return writeToPublicDir(file, campaignId, filename);

  try {
    const sb = createSupabaseAdmin();
    const path = `${campaignId}/${filename}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (error) return null;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

/** Stub/dev fallback: write into public/ so the upload is visible immediately. */
async function writeToPublicDir(
  file: File,
  campaignId: string,
  filename: string,
): Promise<string | null> {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "public", "uploads", "campaign-covers", campaignId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
    return `/uploads/campaign-covers/${campaignId}/${filename}`;
  } catch {
    return null;
  }
}

/**
 * Cover media (picture or video) off the campaign wizard's FormData. Three
 * outcomes, and the difference matters:
 *   a file      → upload, patch to the new URL (a failed upload patches nothing,
 *                 so the campaign keeps the cover it already had)
 *   removeCover → patch coverUrl to undefined, clearing it
 *   neither     → null, i.e. leave whatever is there alone
 */
export async function resolveCoverPatch(
  formData: FormData,
  campaignId: string,
): Promise<{ coverUrl?: string } | null> {
  const file = formData.get("cover");
  if (file instanceof File && file.size > 0) {
    const coverUrl = await uploadCampaignCover(file, campaignId);
    return coverUrl ? { coverUrl } : null;
  }
  if (formData.get("removeCover") === "1") return { coverUrl: undefined };
  return null;
}
