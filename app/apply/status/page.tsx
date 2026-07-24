import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { latestApplicationForProfile, listApplicationPages } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { GlassPanel } from "@/components/app/glass-panel";
import { Button } from "@/components/ui/button";
import { IconClock, IconCheckCircle, IconPlay, IconX } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { views as fmtViews, dhakaDate } from "@/lib/format";
import { startReapplication } from "@/app/apply/actions";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Application status" };

export default async function ApplyStatusPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.access === "active") redirect(routeFor(user));
  if (user.access === "none") redirect("/apply");

  const application = await latestApplicationForProfile(user.id);
  if (!application) redirect("/apply");
  const pages = await listApplicationPages(application.id);

  const waitlisted = application.status === "submitted";
  const declined = application.status === "declined";

  return (
    <div className="klipr-app relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-10">
        <Link href="/" className="mb-2 flex justify-center text-text-hi" aria-label="Klipr home">
          <Logo className="text-[15px]" />
        </Link>

        {/* headline state */}
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          {waitlisted ? (
            <span className="glass flex h-[76px] w-[76px] items-center justify-center rounded-full text-violet-600">
              <IconClock size={34} strokeWidth={1.3} />
            </span>
          ) : declined ? (
            <span className="glass flex h-[76px] w-[76px] items-center justify-center rounded-full text-danger-600">
              <IconX size={30} strokeWidth={1.3} />
            </span>
          ) : (
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-success-bg text-success-600">
              <IconCheckCircle size={34} strokeWidth={1.3} />
            </span>
          )}
          <div>
            <h1 className="text-[23px] font-extrabold tracking-[-0.02em] text-ink-900">
              {waitlisted
                ? "You're on the waitlist"
                : declined
                  ? "Not this time"
                  : "You're in"}
            </h1>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-[1.55] text-ink-600">
              {waitlisted ? (
                <>
                  Application submitted {dhakaDate(application.createdAt)}. We review every page by
                  hand. Most reviews finish within 2 days.
                </>
              ) : declined ? (
                application.declineReason ? (
                  <>Reviewer&rsquo;s note: &ldquo;{application.declineReason}&rdquo;</>
                ) : (
                  <>Your pages weren&rsquo;t ready yet. Reapply once they&rsquo;re more active.</>
                )
              ) : (
                <>Your application was approved. Finish setup to unlock the marketplace.</>
              )}
            </p>
          </div>
          {declined ? (
            <form action={startReapplication}>
              <Button type="submit" className="h-11 px-6 text-[14px]">
                Reapply
              </Button>
            </form>
          ) : null}
          {!waitlisted && !declined ? (
            <Button href="/onboarding" className="h-11 px-6 text-[14px]">
              Finish setup
            </Button>
          ) : null}
        </div>

        {/* per-page review. Always honest, shown once decided */}
        <GlassPanel className="p-4">
          <span className="eyebrow">Per-page review</span>
          <div className="mt-3 flex flex-col gap-2.5">
            {pages.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-ink-100 text-ink-600">
                  <IconPlay size={18} strokeWidth={1.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">{p.handle}</p>
                  <p className="text-[11px] text-ink-500">
                    {PLATFORMS[p.platform].label}
                    {p.selfReportedFollowers ? <> · {fmtViews(p.selfReportedFollowers)}</> : null}
                  </p>
                </div>
                {p.vetStatus === "approved" ? (
                  <span className="rounded-full bg-success-bg px-[9px] py-1 text-[11px] font-bold text-success-600">
                    Approved
                  </span>
                ) : p.vetStatus === "declined" ? (
                  <span className="rounded-full bg-danger-bg px-[9px] py-1 text-[11px] font-bold text-danger-600">
                    Declined
                  </span>
                ) : (
                  <span className="rounded-full bg-warning-bg px-[9px] py-1 text-[11px] font-bold text-warning-600">
                    Under review
                  </span>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>

        {waitlisted ? (
          <GlassPanel className="p-4">
            <span className="eyebrow">What happens next</span>
            <div className="mt-3 flex flex-col gap-[11px] text-[13px] text-ink-700">
              <p className="flex gap-2.5">
                <span className="font-mono font-semibold text-violet-500">01</span>A reviewer opens
                each page and checks it against the Clipper Standard.
              </p>
              <p className="flex gap-2.5">
                <span className="font-mono font-semibold text-violet-500">02</span>Approved pages
                become connectable. You&rsquo;ll set up payouts next.
              </p>
              <p className="flex gap-2.5">
                <span className="font-mono font-semibold text-violet-500">03</span>If a page
                isn&rsquo;t ready, we&rsquo;ll tell you exactly why. Reapply once it&rsquo;s more
                active.
              </p>
            </div>
          </GlassPanel>
        ) : null}

        <form action={signOut} className="text-center">
          <button className="text-[13px] text-ink-400 transition-colors hover:text-ink-900">
            Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
