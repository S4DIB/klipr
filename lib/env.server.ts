import "server-only";
import { z } from "zod";

/**
 * Server-only environment (never import from client components).
 * Everything here is optional so stub-mode dev stays zero-config; feature
 * code branches on presence (e.g. the YouTube adapter goes live only when
 * YOUTUBE_API_KEY is set).
 */
const verifyMode = z.enum(["live", "simulated"]).optional();

const schema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

  YOUTUBE_API_KEY: z.string().min(10).optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(10).optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(10).optional(),

  VERIFY_MODE_YOUTUBE: verifyMode,
  VERIFY_MODE_TIKTOK: verifyMode,
  VERIFY_MODE_INSTAGRAM: verifyMode,
  VERIFY_MODE_FACEBOOK: verifyMode,

  /** 32-byte base64 AES-256-GCM key (OAuth tokens, NID at rest). */
  TOKEN_KEY: z.string().min(40).optional(),
  /** Bearer token for GET /api/cron/sweep. */
  CRON_SECRET: z.string().min(16).optional(),
});

const parsed = schema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  VERIFY_MODE_YOUTUBE: process.env.VERIFY_MODE_YOUTUBE,
  VERIFY_MODE_TIKTOK: process.env.VERIFY_MODE_TIKTOK,
  VERIFY_MODE_INSTAGRAM: process.env.VERIFY_MODE_INSTAGRAM,
  VERIFY_MODE_FACEBOOK: process.env.VERIFY_MODE_FACEBOOK,
  TOKEN_KEY: process.env.TOKEN_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
});

if (!parsed.success) {
  // Same policy as lib/env.ts: a malformed optional var must not crash dev.
  console.warn(
    "[env.server] invalid server env:",
    parsed.error.flatten().fieldErrors,
  );
}

export const serverEnv = parsed.success ? parsed.data : {};
