import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { GoogleGlyph } from "@/components/ui/google-glyph";
import { GlassPanel } from "@/components/app/glass-panel";
import { hasSupabase } from "@/lib/env";
import {
  signInWithGoogle,
  signInAsClipper,
  signInAsNewClipper,
  signInAsAgency,
  signInAsBrand,
  signInAsAdmin,
  signInAsApplicant,
} from "./actions";

export const metadata: Metadata = { title: "Sign in" };

const DEMOS = [
  { action: signInAsClipper, label: "Clipper", sub: "active · set up" },
  { action: signInAsNewClipper, label: "New Clipper", sub: "active · setup checklist" },
  { action: signInAsAgency, label: "Network Manager", sub: "active · 2 pages" },
  { action: signInAsApplicant, label: "Applicant", sub: "waitlisted" },
  { action: signInAsBrand, label: "Brand", sub: "console" },
  { action: signInAsAdmin, label: "Admin", sub: "ops + vetting" },
];

export default function LoginPage() {
  return (
    <div className="relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="grid min-h-dvh place-items-center px-5 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center text-text-hi">
            <Logo className="text-[17px]" />
          </Link>

          <GlassPanel className="p-7 text-center">
            <p className="eyebrow">Sign in</p>
            <h1 className="title mt-2 text-[24px] text-text-hi">Welcome back.</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-text-mid">
              New here? Signing in creates a login. Marketplace access comes
              after your application is reviewed.
            </p>

            <form action={signInWithGoogle} className="mt-6">
              <Button type="submit" className="h-[50px] w-full">
                <GoogleGlyph />
                Continue with Google
              </Button>
            </form>
          </GlassPanel>

          {!hasSupabase && (
            <GlassPanel variant="well" className="mt-4 p-4">
              <p className="eyebrow mb-3 text-center">Local demo identities</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMOS.map(({ action, label, sub }) => (
                  <form key={label} action={action} className="contents">
                    <button
                      type="submit"
                      className="rounded-[12px] bg-white/60 px-3 py-2.5 text-left transition-colors hover:bg-white"
                    >
                      <span className="block text-[13px] font-semibold text-text-hi">{label}</span>
                      <span className="block font-mono text-[10.5px] text-text-low">{sub}</span>
                    </button>
                  </form>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-text-low">
                Stub mode. Data lives in .data/db.json. Google is stubbed.
              </p>
            </GlassPanel>
          )}

          <p className="mt-5 text-center text-[11.5px] text-text-low">
            By continuing you agree to the Klipr terms.
          </p>
        </div>
      </main>
    </div>
  );
}
