import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { GoogleGlyph } from "@/components/ui/google-glyph";
import { GlassPanel } from "@/components/app/glass-panel";
import { signInWithGoogle } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  not_approved:
    "This email isn't approved yet. Klipr is invite-only — join the waitlist and we'll email you once you're in.",
  auth: "Sign-in didn't complete. Please try again.",
  oauth: "Couldn't reach Google. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERRORS[error] : undefined;

  return (
    <div className="relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="grid min-h-dvh place-items-center px-5 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center text-text-hi">
            <Logo className="text-[17px]" />
          </Link>

          {message ? (
            <GlassPanel
              variant="well"
              className="mb-4 border border-[rgba(255,123,192,0.35)] p-4 text-center"
            >
              <p className="text-[13px] font-medium leading-relaxed text-text-hi">{message}</p>
              {error === "not_approved" ? (
                <Link
                  href="/#waitlist"
                  className="mt-2 inline-block text-[13px] font-bold text-volt-500 underline decoration-[rgba(125,4,215,0.35)] underline-offset-2"
                >
                  Join the waitlist →
                </Link>
              ) : null}
            </GlassPanel>
          ) : null}

          <GlassPanel className="p-7 text-center">
            <p className="eyebrow">Sign in</p>
            <h1 className="title mt-2 text-[24px] text-text-hi">Welcome back.</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-text-mid">
              Klipr is invite-only. Approved from the waitlist? Sign in with the same email. Not
              yet?{" "}
              <Link href="/#waitlist" className="font-semibold text-volt-500">
                Join the waitlist
              </Link>
              .
            </p>

            <form action={signInWithGoogle} className="mt-6">
              <Button type="submit" className="h-[50px] w-full">
                <GoogleGlyph />
                Continue with Google
              </Button>
            </form>
          </GlassPanel>

          <p className="mt-5 text-center text-[11.5px] text-text-low">
            By continuing you agree to the Klipr terms.
          </p>
        </div>
      </main>
    </div>
  );
}
