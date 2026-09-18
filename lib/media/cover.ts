/**
 * Campaign cover media rules — shared by the client picker (which validates
 * before upload so the agency gets an instant message) and the server upload
 * (which is the one that actually decides). Isomorphic on purpose: no
 * server-only imports here.
 */

/** Cover art may be a still or a short clip. Videos get the bigger ceiling. */
export const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30 MB

/** The accept="" list the picker offers, kept in sync with what we'll store. */
export const COVER_ACCEPT = [...Object.keys(IMAGE_TYPES), ...Object.keys(VIDEO_TYPES)].join(",");

export type CoverKind = "image" | "video";

export interface CoverClass {
  kind: CoverKind;
  ext: string;
  max: number;
}

/** null ⇒ not a cover type we accept. */
export function classifyCover(type: string): CoverClass | null {
  const t = (type || "").toLowerCase();
  if (IMAGE_TYPES[t]) return { kind: "image", ext: IMAGE_TYPES[t], max: MAX_IMAGE_BYTES };
  if (VIDEO_TYPES[t]) return { kind: "video", ext: VIDEO_TYPES[t], max: MAX_VIDEO_BYTES };
  return null;
}

/** Human-readable rejection reason, or null when the file is fine. */
export function rejectCoverFile(file: { type: string; size: number }): string | null {
  const c = classifyCover(file.type);
  if (!c) return "Use a PNG, JPG, WEBP, GIF, MP4, WEBM or MOV file.";
  if (file.size > c.max) {
    return c.kind === "video"
      ? `Video covers max out at ${MAX_VIDEO_BYTES / 1024 / 1024} MB.`
      : `Picture covers max out at ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

/** URL extensions that mean "render this as a <video>". */
export const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i;
