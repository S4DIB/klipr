import { z } from "zod";

/**
 * Public env (safe to read on the client). Supabase is OPTIONAL: when the URL +
 * anon key are present the app uses real Supabase Auth/Postgres; otherwise it
 * falls back to the local file store + stub auth so dev runs with zero config.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  // Don't crash dev for a malformed optional var — log and continue stubbed.
  console.warn("[env] invalid public env:", parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : {};

export const hasSupabase = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const siteUrl =
  env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
