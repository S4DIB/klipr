import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { signOut } from "@/lib/auth/actions";
import { getLeadByEmail } from "@/lib/leads";
import { listConnectedAccounts, listVettedPagesForProfile } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { IconCheckCircle, IconChevronLeft } from "@/components/icons";
import { PreviewCard } from "./preview-card";
import { ProfileStep } from "./profile-step";
import { AboutStep } from "./about-step";
import { ConnectStep, type ConnectPage } from "./connect-step";
import { BkashForm } from "./bkash-form";
import { backTo } from "./actions";

export const metadata: Metadata = { title: "Set up" };

const STEPS = ["Profile", "About you", "Connect", "Payout"];

/**
 * Post-approval onboarding — four steps inside one centred Royal Violet card on
 * the ivory field, matching the sign-in. White type, translucent inputs, a
 * white preview inset. Progress persists in Profile.onboardingStep.
 */
export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "brand" || user.role === "admin") redirect(routeFor(user));
  if (user.access !== "active") redirect(routeFor(user));
  if (user.profileCompleted) redirect("/home");

  const step = Math.min(user.onboardingStep, 3);

  const [lead, vettedPages, accounts] = await Promise.all([
    getLeadByEmail(user.email),
    listVettedPagesForProfile(user.id),
    listConnectedAccounts(user.id),
  ]);

  const name = user.displayName?.trim() || "";
  const username = user.username ?? "";
  const languages = user.postLanguages
    ? user.postLanguages.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const connectPages: ConnectPage[] = vettedPages.map((p) => {
    const acc = accounts.find((a) => a.applicationPageId === p.id && a.status !== "revoked");
    return {
      id: p.id,
      platform: p.platform,
      handle: p.handle,
      url: p.url,
      status: acc ? (acc.status === "active" ? "active" : "pending") : "none",
      fromWaitlist: true,
    };
  });

  return (
    <div className="relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />

      <form action={signOut} className="absolute right-5 top-5 z-10 sm:right-8 sm:top-6">
        <button
          type="submit"
          className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:bg-[rgba(53,5,90,0.05)] hover:text-ink-800"
        >
          Sign out
        </button>
      </form>

      <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-5 py-16">
        <div className="rounded-[28px] bg-[#7d04d7] px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_6px_rgba(53,5,90,0.2),0_44px_90px_-30px_rgba(125,4,215,0.55)] sm:px-9 sm:py-10">
          <div className="mb-6 flex justify-center [&_svg]:text-ivory">
            <Logo className="text-[16px]" />
          </div>

          <Stepper current={step} />

          <div className="mt-7">
            {step === 0 && (
              <ProfileStep
                avatarUrl={user.avatarUrl}
                firstName={user.firstName ?? ""}
                lastName={user.lastName ?? ""}
                username={username}
                mobile={lead?.phone}
                email={user.email}
              />
            )}
            {step === 1 && (
              <AboutStep
                avatarUrl={user.avatarUrl}
                name={name}
                username={username}
                location={user.location ?? ""}
                languages={languages}
                onBack={<BackButton to={0} />}
              />
            )}
            {step === 2 && (
              <ConnectStep
                avatarUrl={user.avatarUrl}
                name={name}
                username={username}
                location={user.location ?? undefined}
                languages={languages}
                pages={connectPages}
                onBack={<BackButton to={1} />}
              />
            )}
            {step === 3 && (
              <BkashForm
                avatarUrl={user.avatarUrl}
                name={name}
                username={username}
                location={user.location ?? undefined}
                languages={languages}
                defaultValue={user.bkashNumber}
                onBack={<BackButton to={2} />}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Four-step rail inside the violet card — white active pill, checks behind. */
function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Setup progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const loadingLine = i === current - 1; // the previous → current connector
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5 last:flex-none">
            {done ? (
              <IconCheckCircle size={24} strokeWidth={1.5} className="shrink-0 text-white" />
            ) : (
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ${
                  active
                    ? "step-blink bg-white font-bold text-violet-900"
                    : "bg-white/15 text-white"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {i + 1}
              </span>
            )}
            {i < STEPS.length - 1 && (
              <span
                className={`step-dash h-[1.5px] flex-1 text-white ${
                  loadingLine ? "step-dash-load" : ""
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Server-rendered back control, passed into the client steps as a prop. */
function BackButton({ to }: { to: number }) {
  return (
    <form action={backTo}>
      <input type="hidden" name="step" value={to} />
      <button
        type="submit"
        aria-label="Back"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 hover:text-white"
      >
        <IconChevronLeft size={18} strokeWidth={1.6} />
      </button>
    </form>
  );
}
