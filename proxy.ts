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
  // Landing page: inverse gate. `/` is fully static, so anonymous visitors
  // (virtually all ad/landing traffic) must pass through untouched with zero
  // auth work. Only a request carrying a session cookie pays a verification,
  // and a live session bounces to /login, whose routeFor dispatch places the
  // user in the app. Stale cookies fall through to the landing page.
  const isLanding = req.nextUrl.pathname === "/";
  if (isLanding) {
    const hasSessionCookie = hasSupabase
      ? req.cookies
          .getAll()
          .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
      : Boolean(req.cookies.get(COOKIE)?.value);
    if (!hasSessionCookie) return NextResponse.next();
  }

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
    if (isLanding) {
      return user ? NextResponse.redirect(new URL("/login", req.url)) : res;
    }
    return user ? res : toLogin(req);
  }

  // stub mode
  if (isLanding) return NextResponse.redirect(new URL("/login", req.url));
  return req.cookies.get(COOKIE)?.value ? NextResponse.next() : toLogin(req);
}

export const config = {
  matcher: [
    "/",
    "/apply/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/campaigns/:path*",
    "/clips/:path*",
    "/wallet/:path*",
    "/leaderboard/:path*",
    "/connections/:path*",
    "/settings/:path*",
    // The agency console. (It used to live at /brand, which collided with the
    // /public/brand/* landing assets; those stay public and unguarded.)
    "/agency/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};
