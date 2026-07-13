import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, hasSupabase } from "@/lib/env";

/**
 * Proxy (Next 16's renamed Middleware). With Supabase configured it refreshes
 * the auth session (per @supabase/ssr) and bounces logged-out users; otherwise
 * it does the same optimistically off the stub cookie. The real role/onboarding
 * gates live in the route layouts (DB-aware).
 */
const COOKIE = "klipr_uid";

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  if (hasSupabase) {
    let res = NextResponse.next({ request: req });
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(items) {
            for (const { name, value } of items) req.cookies.set(name, value);
            res = NextResponse.next({ request: req });
            for (const { name, value, options } of items) {
              res.cookies.set(name, value, options);
            }
          },
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? res : toLogin(req);
  }

  // stub mode
  return req.cookies.get(COOKIE)?.value ? NextResponse.next() : toLogin(req);
}

export const config = {
  matcher: [
    "/marketplace/:path*",
    "/dashboard/:path*",
    "/campaign/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};
