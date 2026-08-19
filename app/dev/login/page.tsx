import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasSupabase } from "@/lib/env";
import { listProfiles } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { GlassPanel } from "@/components/app/glass-panel";
import { Button } from "@/components/ui/button";
import { signInAsProfile } from "./actions";

export const metadata: Metadata = { title: "Account switcher (dev)" };

/**
 * DEV-ONLY account switcher. The stub sign-in button always lands on the
 * KLIPR_DEV_ADMIN_EMAIL identity, so this page lists every local profile and
 * signs you in as any of them with one click. Returns 404 whenever Supabase
 * is configured (production), so it can never be reached on the live site.
 */
export default async function DevLoginPage() {
  if (hasSupabase) notFound();

  const profiles = await listProfiles();

  return (
    <div className="relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-12">
        <Link href="/" className="mb-8 flex justify-center text-text-hi">
          <Logo className="text-[17px]" />
        </Link>

        <GlassPanel className="w-full p-6 sm:p-8">
          <p className="eyebrow text-center">Dev account switcher</p>
          <h1 className="title mt-2 text-center text-[22px] text-text-hi">
            Sign in as any local account
          </h1>
          <p className="mt-2 text-center text-[13.5px] leading-relaxed text-text-mid">
            The stub Google button always signs in as the dev admin. Use this to
            switch into any profile in your local store instead.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {profiles.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-text-mid">
                No local profiles yet — sign in once or seed the store first.
              </p>
            ) : (
              profiles.map((p) => (
                <form key={p.id} action={signInAsProfile}>
                  <input type="hidden" name="profileId" value={p.id} />
                  <button
                    type="submit"
                    className="liftrow flex w-full items-center gap-3 rounded-[--radius-control] border border-[rgba(53,5,90,0.08)] bg-white/70 px-4 py-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt-600 font-mono text-[13px] text-yellow">
                      {(p.displayName || "K").trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-text-hi">
                        {p.displayName}
                      </span>
                      <span className="block truncate text-[12px] text-text-mid">{p.email}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[rgba(53,5,90,0.06)] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-text-mid">
                      {p.role}
                    </span>
                  </button>
                </form>
              ))
            )}
          </div>

          <div className="mt-5 flex justify-center">
            <Button href="/login" variant="ghost" className="h-10 px-5 text-[13.5px]">
              Back to real sign-in
            </Button>
          </div>

          <p className="mt-4 text-center text-[12px] text-text-low">
            Local dev only — this page 404s in production.
          </p>
        </GlassPanel>
      </main>
    </div>
  );
}
