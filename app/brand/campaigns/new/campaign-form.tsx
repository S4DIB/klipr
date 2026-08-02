"use client";

import { useActionState, useState, type ReactNode } from "react";
import { BoltMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconUpload } from "@/components/icons";
import { NICHES, PLATFORMS, PLATFORM_ORDER } from "@/lib/platforms";
import { cn } from "@/lib/cn";
import { poishaToTaka } from "@/lib/money";
import { dhakaDateInput } from "@/lib/format";
import { createCampaign, editCampaign, type NewCampaignState } from "./actions";
import type { Campaign, Platform } from "@/lib/db/types";

const STEPS = ["Basics", "Budget & rules", "Creative & review"];
const MIN_OPTIONS = [2000, 3000, 4000];

/** Field control tuned for the Royal Violet card — translucent white on violet. */
const control =
  "w-full rounded-[14px] border border-white/50 bg-white/12 px-3.5 py-2.5 text-[14.5px] text-white placeholder:text-white/70 outline-none transition-colors focus:border-white focus:bg-white/18";

function VLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-medium text-white">{children}</label>;
}

/** Fixed, read-only value (brand name, fixed rate, tracking window). */
function VReadout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <VLabel>{label}</VLabel>
      <div className="rounded-[14px] border border-white/40 bg-white/[0.06] px-3.5 py-2.5 text-[14.5px] text-white">
        {children}
      </div>
    </div>
  );
}

/**
 * The 3-step campaign wizard in the Royal Violet card (matching sign-in /
 * onboarding): Basics → Budget & rules → Creative & review. One form,
 * client-side steps; the server action validates and moves the campaign to
 * PENDING FUNDING. Pass `campaign` to edit an existing one — fields prefill.
 */
export function CampaignForm({
  brandName,
  campaign,
}: {
  brandName: string;
  campaign?: Campaign;
}) {
  const editing = Boolean(campaign);
  const [state, action, pending] = useActionState<NewCampaignState, FormData>(
    editing ? editCampaign : createCampaign,
    {},
  );
  const [step, setStep] = useState(1);
  const [platforms, setPlatforms] = useState<Set<Platform>>(
    new Set(campaign?.allowedPlatforms ?? ["tiktok", "youtube"]),
  );
  const [minViews, setMinViews] = useState(campaign?.minQualifyViews ?? 2000);
  const [budget, setBudget] = useState(
    campaign ? String(poishaToTaka(campaign.budgetPoisha)) : "60000",
  );
  // Controlled so values in the hidden step panels still submit (React's form
  // action captures controlled values but drops uncontrolled ones off-step).
  const [name, setName] = useState(campaign?.name ?? "");
  const [niche, setNiche] = useState(campaign?.niche ?? "Fashion");
  const [endDate, setEndDate] = useState(campaign ? dhakaDateInput(campaign.endDate) : "");
  const [maxPerClipper, setMaxPerClipper] = useState(
    campaign ? String(poishaToTaka(campaign.maxPayoutPerClipperPoisha)) : "5000",
  );
  const [subCap, setSubCap] = useState(campaign ? String(campaign.submissionCapBase) : "1");
  const [brief, setBrief] = useState(campaign?.brief ?? "");
  const [guidelines, setGuidelines] = useState(campaign?.guidelines ?? "");
  const [sourceUrl, setSourceUrl] = useState(campaign?.sourceUrl ?? "");

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  const budgetNum = Number(budget) || 0;

  /** Pill toggle styling shared by the platform + min-view choices. */
  const pill = (on: boolean, extra?: string) =>
    cn(
      "rounded-[12px] px-3.5 py-[9px] text-[13px] transition-colors",
      on
        ? "bg-white font-bold text-violet-900"
        : cn("border border-white/50 bg-white/12 font-semibold text-white hover:bg-white/18", extra),
    );

  return (
    <div className="w-full rounded-[28px] bg-[#7d04d7] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_6px_rgba(53,5,90,0.2),0_44px_90px_-30px_rgba(125,4,215,0.55)] sm:px-10 sm:py-12">
      <div className="mx-auto w-full max-w-[680px]">
        <div className="mb-4 flex justify-center">
          <BoltMark className="h-9 w-auto text-ivory" />
        </div>
        <h1 className="mb-6 text-center font-display text-[24px] font-bold leading-[1.1] tracking-[-0.02em] text-ivory">
          {editing ? "Edit campaign" : "New campaign"}
        </h1>

        <Stepper current={step - 1} labels={STEPS} onStep={(i) => setStep(i + 1)} />
        <p className="mt-3 text-center text-[12px] font-semibold text-white">
          Step {step} of {STEPS.length} · {STEPS[step - 1]}
        </p>

        <form action={action} className="mt-7 flex flex-col gap-5">
          {editing ? <input type="hidden" name="campaignId" value={campaign!.id} /> : null}

          {/* step 1. Basics */}
          <div className={cn("flex-col gap-4", step === 1 ? "flex" : "hidden")}>
            <div>
              <VLabel>Campaign name</VLabel>
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seen by every clipper"
                className={control}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <VReadout label="Brand">{brandName}</VReadout>
              </div>
              <div className="flex-1">
                <VLabel>Niche</VLabel>
                <select
                  name="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className={cn(control, "appearance-none [&>option]:text-[#1c0a2e]")}
                >
                  {NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <VLabel>Platforms</VLabel>
              <div className="flex flex-wrap gap-[9px]">
                {PLATFORM_ORDER.map((p) => {
                  const meta = PLATFORMS[p];
                  const on = platforms.has(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePlatform(p)}
                      className={cn("flex items-center gap-1.5", pill(on))}
                    >
                      {p === "facebook" ? "Facebook · secondary" : meta.surface}
                      {meta.recommended && (
                        <span className="rounded-[6px] bg-yellow px-[5px] py-[2px] text-[9px] font-bold text-violet-900">
                          REC
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {[...platforms].map((p) => (
              <input key={p} type="hidden" name={`platform_${p}`} value="on" />
            ))}
          </div>

          {/* step 2. Budget & rules */}
          <div className={cn("flex-col gap-4", step === 2 ? "flex" : "hidden")}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <VLabel>Budget (ceiling)</VLabel>
                <input
                  name="budgetTaka"
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
                  className={cn(control, "font-mono [font-variant-numeric:tabular-nums]")}
                />
                <p className="mt-1.5 text-[11.5px] text-white">
                  {budgetNum >= 5000
                    ? `≈ ${Math.floor((budgetNum / 60) * 1000).toLocaleString("en-US")} verified views`
                    : "min ৳5,000"}
                </p>
              </div>
              <div className="flex-1">
                <VReadout label="You pay · fixed">
                  <span className="font-mono text-white">৳60</span> / 1,000 verified views
                </VReadout>
              </div>
            </div>

            <div>
              <VLabel>Qualification minimum</VLabel>
              <div className="flex flex-wrap items-center gap-2">
                {MIN_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={minViews === v}
                    onClick={() => setMinViews(v)}
                    className={pill(minViews === v)}
                  >
                    {v.toLocaleString("en-US")}
                  </button>
                ))}
                <span className="text-[11.5px] text-white">
                  Clips below this settle at ৳0 and earn no XP.
                </span>
              </div>
              <input type="hidden" name="minQualifyViews" value={minViews} />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <VReadout label="Tracking window">7 days</VReadout>
              </div>
              <div className="flex-1">
                <VLabel>End date</VLabel>
                <input
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(control, "[color-scheme:dark]")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <VLabel>Max per clipper (৳)</VLabel>
                <input
                  name="maxPerClipperTaka"
                  inputMode="numeric"
                  value={maxPerClipper}
                  onChange={(e) => setMaxPerClipper(e.target.value.replace(/\D/g, ""))}
                  className={cn(control, "font-mono [font-variant-numeric:tabular-nums]")}
                />
              </div>
              <div className="flex-1">
                <VLabel>Submissions per clipper</VLabel>
                <select
                  name="submissionCapBase"
                  value={subCap}
                  onChange={(e) => setSubCap(e.target.value)}
                  className={cn(control, "appearance-none [&>option]:text-[#1c0a2e]")}
                >
                  {[1, 2, 3, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* step 3. Creative & review */}
          <div className={cn("flex-col gap-4", step === 3 ? "flex" : "hidden")}>
            <div>
              <VLabel>The brief</VLabel>
              <textarea
                name="brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Post the supplied clip to your page. Hook in 2s, keep product name on screen…"
                className={cn(control, "min-h-[96px] resize-y leading-[1.5]")}
              />
            </div>
            <div>
              <VLabel>Rules · one per line (optional)</VLabel>
              <textarea
                name="guidelines"
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                placeholder={"Keep the supplied audio\nNo political or edited-price claims"}
                className={cn(control, "min-h-[72px] resize-y leading-[1.5]")}
              />
            </div>
            <div>
              <VLabel>Clip asset</VLabel>
              <div className="flex flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-white/60 p-5 text-center">
                <span className="text-ivory">
                  <IconUpload size={22} strokeWidth={1.4} />
                </span>
                <input
                  name="sourceUrl"
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="Paste the link to the exact video clippers download and post"
                  className={cn(control, "max-w-[420px] text-center")}
                />
              </div>
            </div>

            {/* review */}
            <div className="rounded-[18px] border border-white/40 bg-white/[0.08] p-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                Review
              </span>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3.5 text-[13px] text-white sm:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-white">Budget</span>
                  <span className="font-mono [font-variant-numeric:tabular-nums]">
                    ৳{budgetNum.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Rate</span>
                  <span className="font-mono">৳60 / 1k</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Min views</span>
                  <span className="font-mono [font-variant-numeric:tabular-nums]">
                    {minViews.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Window</span>
                  <span className="font-mono">7 days</span>
                </div>
              </div>
              <p className="mt-3.5 border-t border-white/40 pt-3 text-[12px] leading-[1.5] text-white">
                {editing ? (
                  <>
                    Changes save immediately. The campaign stays in{" "}
                    <b className="text-yellow">Pending funding</b> until an admin confirms your
                    escrow deposit.
                  </>
                ) : (
                  <>
                    On create, the campaign moves to <b className="text-yellow">Pending funding</b>.
                    It goes live once an admin confirms your escrow deposit.
                  </>
                )}
              </p>
            </div>
          </div>

          {state.error ? (
            <p className="text-[13.5px] font-semibold text-yellow" role="alert">
              {state.error}
            </p>
          ) : null}

          {/* footer */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className={cn(
                "rounded-full border border-white/60 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-white/10",
                step === 1 && "invisible",
              )}
            >
              Back
            </button>
            {step < 3 ? (
              <Button
                type="button"
                variant="inverse"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="h-11 px-6 text-[14px]"
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" variant="inverse" disabled={pending} className="h-11 px-6 text-[14px]">
                {editing
                  ? pending
                    ? "Saving…"
                    : "Save changes"
                  : pending
                    ? "Creating…"
                    : "Create → send to funding"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/** Progress rail inside the violet card — white active pill, checks behind. */
function Stepper({
  current,
  labels,
  onStep,
}: {
  current: number;
  labels: string[];
  onStep: (i: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Campaign setup progress">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const loadingLine = i === current - 1;
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5 last:flex-none">
            <button
              type="button"
              onClick={() => onStep(i)}
              aria-current={active ? "step" : undefined}
              aria-label={label}
            >
              {done ? (
                <IconCheckCircle size={24} strokeWidth={1.5} className="shrink-0 text-white" />
              ) : (
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px]",
                    active ? "step-blink bg-white font-bold text-violet-900" : "border-2 border-white text-white",
                  )}
                >
                  {i + 1}
                </span>
              )}
            </button>
            {i < labels.length - 1 && (
              <span className={cn("step-dash h-[1.5px] flex-1 text-white", loadingLine && "step-dash-load")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
