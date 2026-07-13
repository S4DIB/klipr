import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { GoogleGlyph } from "@/components/ui/google-glyph";
import { hasSupabase } from "@/lib/env";
import { signInWithGoogle, signInAsAdmin } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6 py-20">
      {/* soft backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(125,4,215,0.10), transparent 70%)",
        }}
      />
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex justify-center">
          <Logo className="text-xl" />
        </Link>

        <div className="card-shadow rounded-2xl border border-line bg-white p-8 text-center">
          <h1 className="display text-3xl text-text-hi">Welcome to Klipr</h1>
          <p className="mt-3 text-text-mid">
            Sign in to browse campaigns, submit clips and track your earnings.
          </p>

          <form action={signInWithGoogle} className="mt-8">
            <Button type="submit" className="h-[52px] w-full">
              <GoogleGlyph />
              Continue with Google
            </Button>
          </form>

          <p className="mt-4 text-xs text-text-low">
            No forms yet — set up your profile after you sign in.
          </p>

          {!hasSupabase && (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="hairline" />
                <span className="text-xs text-text-low">or</span>
                <span className="hairline" />
              </div>
              <form action={signInAsAdmin}>
                <Button type="submit" variant="ghost" className="h-11 w-full text-sm">
                  Explore the admin console (demo)
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-text-low">
          By continuing you agree to the Klipr terms.
          {!hasSupabase && " Local demo: Google is stubbed."}
        </p>
      </div>
    </main>
  );
}
