import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasSupabase } from "@/lib/env";
import { Logo } from "@/components/ui/logo";
import { GlassPanel } from "@/components/app/glass-panel";
import { Button, ArrowEast } from "@/components/ui/button";
import { startApplyPreview } from "./actions";

export const metadata: Metadata = { title: "Apply preview (dev)" };

/**
 * DEV-ONLY harness for the /apply flow — the front door for accounts without
 * marketplace access. Shows the Clipper / Agency / Brand tabs (Brand is the
 * self-serve signup). Returns 404 whenever Supabase is configured (production).
 */
export default function DevApplyPreviewPage() {
  if (hasSupabase) notFound();

  return (
    <div className="relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-12">
        <Link href="/" className="mb-8 flex justify-center text-text-hi">
          <Logo className="text-[17px]" />
        </Link>

        <GlassPanel className="w-full p-6 text-center sm:p-8">
          <p className="eyebrow">Dev preview</p>
          <h1 className="title mt-2 text-[22px] text-text-hi">See the /apply flow</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-text-mid">
            Signs you in as a throwaway account with no access and drops you on{" "}
            <b>/apply</b>, where the <b>Clipper · Agency · Brand</b> tabs live. Brand
            is the self-serve signup; clipper/agency are invite-only. Re-run to reset.
          </p>
          <form action={startApplyPreview} className="mt-6">
            <Button type="submit" className="w-full">
              Start preview <ArrowEast />
            </Button>
          </form>
          <p className="mt-3 text-[12px] text-text-low">
            Local dev only — this page 404s in production.
          </p>
        </GlassPanel>
      </main>
    </div>
  );
}
