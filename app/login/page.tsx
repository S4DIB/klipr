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
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="flex min-h-dvh items-center justify-center px-5 py-16">
        <div className="w-full max-w-[416px]">
          {message ? (
            <GlassPanel
              variant="well"
              className="mb-5 border border-[rgba(255,123,192,0.35)] p-4 text-center"
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

          {/* One prominent Royal Violet box holds everything */}
          <div className="rounded-[28px] bg-[#7d04d7] px-7 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_6px_rgba(53,5,90,0.2),0_44px_90px_-30px_rgba(125,4,215,0.55)] sm:px-9">
            {/* Official Klipr logo lockup — ivory on violet */}
            <Link
              href="/"
              aria-label="Klipr — back to home"
              className="mb-5 flex justify-center transition-opacity duration-200 hover:opacity-80 [&_svg]:text-ivory"
            >
              <Logo className="text-[18px]" />
            </Link>

            <h1 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-ivory">
              Sign in to Klipr
            </h1>
            <p className="mx-auto mt-3 max-w-[32ch] text-[13.5px] leading-relaxed text-ivory/80">
              Klipr is invite-only. Approved from the waitlist? Sign in with the same email. Not
              yet?{" "}
              <Link href="/#waitlist" className="font-semibold text-yellow hover:underline">
                Join the waitlist
              </Link>
              .
            </p>

            <form action={signInWithGoogle} className="mt-7">
              <Button type="submit" variant="inverse" className="h-[52px] w-full text-[15px]">
                <GoogleGlyph />
                Continue with Google
              </Button>
            </form>

            <div className="mx-auto mt-8 h-px w-full bg-[rgba(255,255,255,0.18)]" />
            <p className="mt-4 text-[11.5px] leading-relaxed text-ivory/60">
              By continuing you agree to the Klipr terms.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
