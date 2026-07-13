import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** User-scoped Supabase client for Server Components / Actions (RLS enforced). */
export async function createSupabaseServer() {
  const jar = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(items) {
          try {
            for (const { name, value, options } of items) {
              jar.set(name, value, options);
            }
          } catch {
            // called from a Server Component (read-only cookies) — safe to ignore;
            // the proxy refreshes the session on the next request.
          }
        },
      },
    },
  );
}
