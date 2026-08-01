import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { signOut } from "@/lib/auth/actions";
import { getLeadByEmail } from "@/lib/leads";
import { listConnectedAccounts, listVettedPagesForProfile } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { IconCheckCircle, IconChevronLeft } from "@/components/icons";
import { ProfileStep } from "./profile-step";
import { AboutStep } from "./about-step";
import { ConnectStep, type ConnectPage } from "./connect-step";
import { BkashForm } from "./bkash-form";
import { BusinessStep } from "./business-step";
import { DetailsStep } from "./details-step";
import { FinishStep } from "./finish-step";
import { backTo } from "./actions";

export const metadata: Metadata = { title: "Set up" };

const CLIPPER_STEPS = ["Profile", "About you", "Connect", "Payout"];
const BRAND_STEPS = ["Business", "Details", "Finish"];

/**
 * Post-approval onboarding inside one centred Royal Violet card. Role-aware:
 * clippers/agencies get the 4-step flow, brands get the 3-step business setup.
 * Progress persists in Profile.onboardingStep.
 */
export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect(routeFor(user));
  if (user.access !== "active") redirect(routeFor(user));
  if (user.profileCompleted) redirect(routeFor(user));

  const isBrand = user.role === "brand";
  const steps = isBrand ? BRAND_STEPS : CLIPPER_STEPS;
  const step = Math.min(user.onboardingStep, steps.length - 1);
  const name = user.displayName?.trim() || "";

  // clipper/agency-only data
  let leadPhone: string | undefined;
  let languages: string[] = [];
  let connectPages: ConnectPage[] = [];
  if (!isBrand) {
    const [lead, vettedPages, accounts] = await Promise.all([
      getLeadByEmail(user.email),
      listVettedPagesForProfile(user.id),
      listConnectedAccounts(user.id),
    ]);
    leadPhone = lead?.phone;
    languages = user.postLanguages
      ? user.postLanguages.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    connectPages = vettedPages.map((p) => {
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
  }

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

          <Stepper current={step} labels={steps} />

          <div className="mt-7">
            {isBrand ? (
              <>
                {step === 0 && (
                  <BusinessStep
                    orgName={user.orgName ?? ""}
                    website={user.website ?? ""}
                    logoUrl={user.logoUrl}
                  />
                )}
                {step === 1 && (
                  <DetailsStep
                    businessName={user.orgName ?? ""}
                    website={user.website ?? ""}
                    logoUrl={user.logoUrl}
                    industry={user.industry ?? ""}
                    country={user.location ?? ""}
                    monthlySpend={user.monthlySpend ?? ""}
                    onBack={<BackButton to={0} />}
                  />
                )}
                {step === 2 && (
                  <FinishStep
                    businessName={user.orgName ?? ""}
                    website={user.website ?? ""}
                    logoUrl={user.logoUrl}
                    industry={user.industry ?? undefined}
                    country={user.location ?? undefined}
                    avatarUrl={user.avatarUrl}
                    email={user.email}
                    firstName={user.firstName ?? ""}
                    lastName={user.lastName ?? ""}
                    experience={user.campaignExperience ?? ""}
                    onBack={<BackButton to={1} />}
                  />
                )}
              </>
            ) : (
              <>
                {step === 0 && (
                  <ProfileStep
                    avatarUrl={user.avatarUrl}
                    firstName={user.firstName ?? ""}
                    lastName={user.lastName ?? ""}
                    username={user.username ?? ""}
                    mobile={leadPhone}
                    email={user.email}
                  />
                )}
                {step === 1 && (
                  <AboutStep
                    avatarUrl={user.avatarUrl}
                    name={name}
                    username={user.username ?? ""}
                    location={user.location ?? ""}
                    languages={languages}
                    onBack={<BackButton to={0} />}
                  />
                )}
                {step === 2 && (
                  <ConnectStep
                    avatarUrl={user.avatarUrl}
                    name={name}
                    username={user.username ?? ""}
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
                    username={user.username ?? ""}
                    location={user.location ?? undefined}
                    languages={languages}
                    defaultValue={user.bkashNumber}
                    onBack={<BackButton to={2} />}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Progress rail inside the violet card — white active pill, checks behind. */
function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Setup progress">
      {labels.map((label, i) => {
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
            {i < labels.length - 1 && (
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
