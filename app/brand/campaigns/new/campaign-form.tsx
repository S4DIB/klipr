"use client";

import { useActionState, useState } from "react";
import { GlassPanel } from "@/components/app/glass-panel";
import { Button } from "@/components/ui/button";
import { IconUpload } from "@/components/icons";
import { NICHES, PLATFORMS, PLATFORM_ORDER } from "@/lib/platforms";
import { cn } from "@/lib/cn";
import { createCampaign, type NewCampaignState } from "./actions";
import type { Platform } from "@/lib/db/types";

const STEPS = ["Basics", "Budget & rules", "Creative & review"];
const MIN_OPTIONS = [2000, 3000, 4000];

const well =
  "focus-quiet glass-well w-full px-3.5 py-3 text-[14px] text-ink-900 placeholder:text-ink-400 transition-colors focus:border-[rgba(125,4,215,0.5)]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-[7px]">{children}</p>;
}

/**
 * The 3-step campaign wizard: Basics → Budget & rules → Creative & review.
 * One form, client-side steps; the server action validates everything and
 * moves the campaign to PENDING FUNDING.
 */
export function CampaignForm({ brandName }: { brandName: string }) {
  const [state, action, pending] = useActionState<NewCampaignState, FormData>(createCampaign, {});
  const [step, setStep] = useState(1);
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(["tiktok", "youtube"]));
  const [minViews, setMinViews] = useState(2000);
  const [earlyAccess, setEarlyAccess] = useState(true);
  const [budget, setBudget] = useState("60000");
  // Controlled so values in the hidden step panels still submit (React's form
  // action captures controlled values but drops uncontrolled ones off-step).
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("Fashion");
  const [endDate, setEndDate] = useState("");
  const [maxPerClipper, setMaxPerClipper] = useState("5000");
  const [subCap, setSubCap] = useState("1");
  const [brief, setBrief] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  const budgetNum = Number(budget) || 0;

  return (
    <form action={action} className="mx-auto flex max-w-[760px] flex-col gap-5">
      {/* stepper */}
      <div className="flex items-center gap-2.5">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const reached = step >= n;
          return (
            <div key={label} className="contents">
              {i > 0 && <div className="h-[2px] flex-1 bg-[rgba(53,5,90,0.12)]" />}
              <button
                type="button"
                onClick={() => setStep(n)}
                className="flex flex-none items-center gap-2"
              >
                <span
                  className={cn(
                    "flex h-[26px] w-[26px] items-center justify-center rounded-full font-mono text-[12px] font-semibold transition-colors",
                    reached ? "bg-violet-600 text-white" : "bg-ink-150 text-ink-500",
                  )}
                >
                  {n}
                </span>
                <span
                  className={cn(
                    "text-[12.5px]",
                    step === n ? "font-bold text-ink-900" : "font-semibold text-ink-500",
                  )}
                >
                  {label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* step 1. Basics */}
      <GlassPanel className={cn("flex-col gap-4 p-[22px]", step === 1 ? "flex" : "hidden")}>
        <div>
          <FieldLabel>Campaign name</FieldLabel>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seen by every clipper"
            className={well}
          />
        </div>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="flex-1">
            <FieldLabel>Brand name</FieldLabel>
            <div className="glass-well px-3.5 py-3 text-[14px] text-ink-600">{brandName}</div>
          </div>
          <div className="flex-1">
            <FieldLabel>Niche</FieldLabel>
            <select
              name="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className={cn(well, "appearance-none")}
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
          <p className="eyebrow mb-[9px]">Platforms</p>
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
                  className={cn(
                    "flex items-center gap-1.5 rounded-[12px] px-3.5 py-[9px] text-[13px] transition-colors",
                    on
                      ? "bg-violet-900 font-bold text-white"
                      : cn(
                          "bg-white font-semibold shadow-[var(--shadow-xs)]",
                          p === "facebook" ? "text-ink-400" : "text-ink-600",
                        ),
                  )}
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
      </GlassPanel>

      {/* step 2. Budget & rules */}
      <div className={cn("flex-col gap-3.5", step === 2 ? "flex" : "hidden")}>
        <GlassPanel className="flex flex-col gap-4 p-[22px]">
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1">
              <FieldLabel>Budget (ceiling)</FieldLabel>
              <input
                name="budgetTaka"
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
                className={cn(well, "font-mono [font-variant-numeric:tabular-nums]")}
              />
              <p className="mt-1.5 text-[11.5px] text-ink-500">
                {budgetNum >= 5000
                  ? `≈ ${Math.floor((budgetNum / 60) * 1000).toLocaleString("en-US")} verified views`
                  : "min ৳5,000"}
              </p>
            </div>
            <div className="flex-1">
              <FieldLabel>You pay · fixed</FieldLabel>
              <div className="glass-well px-3.5 py-3 text-[14px] text-ink-500">
                <span className="font-mono text-ink-900">৳60</span> / 1,000 verified views
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-[9px]">Qualification minimum</p>
            <div className="flex flex-wrap items-center gap-2">
              {MIN_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={minViews === v}
                  onClick={() => setMinViews(v)}
                  className={cn(
                    "rounded-[12px] px-4 py-[9px] text-[13px] transition-colors",
                    minViews === v
                      ? "bg-violet-900 font-bold text-white"
                      : "bg-white font-semibold text-ink-600 shadow-[var(--shadow-xs)]",
                  )}
                >
                  {v.toLocaleString("en-US")}
                </button>
              ))}
              <span className="text-[11.5px] text-ink-500">
                Clips below this settle at ৳0 and earn no XP.
              </span>
            </div>
            <input type="hidden" name="minQualifyViews" value={minViews} />
          </div>

          <label className="glass-well flex cursor-pointer items-center justify-between gap-4 p-3.5">
            <span>
              <span className="block text-[13.5px] font-bold text-ink-900">
                Early access for Pro+ clippers
              </span>
              <span className="mt-[2px] block text-[12px] text-ink-500">
                A head-start window before it opens to everyone.
              </span>
            </span>
            <input
              type="checkbox"
              checked={earlyAccess}
              onChange={(e) => setEarlyAccess(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-[28px] w-[46px] shrink-0 rounded-full bg-ink-200 transition-colors peer-checked:bg-violet-600 peer-focus-visible:outline-2 peer-focus-visible:outline-violet-500 [&>span]:absolute [&>span]:left-[3px] [&>span]:top-[3px] [&>span]:h-[22px] [&>span]:w-[22px] [&>span]:rounded-full [&>span]:bg-white [&>span]:shadow-[var(--shadow-sm)] [&>span]:transition-transform peer-checked:[&>span]:translate-x-[18px]">
              <span />
            </span>
          </label>
          <input type="hidden" name="earlyAccess" value={earlyAccess ? "pro" : "none"} />
          {earlyAccess ? <input type="hidden" name="earlyAccessDays" value="3" /> : null}

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1">
              <FieldLabel>Tracking window</FieldLabel>
              <div className="glass-well px-3.5 py-3 text-[14px] text-ink-600">7 days</div>
            </div>
            <div className="flex-1">
              <FieldLabel>End date</FieldLabel>
              <input
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={well}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1">
              <FieldLabel>Max per clipper (৳)</FieldLabel>
              <input
                name="maxPerClipperTaka"
                inputMode="numeric"
                value={maxPerClipper}
                onChange={(e) => setMaxPerClipper(e.target.value.replace(/\D/g, ""))}
                className={cn(well, "font-mono [font-variant-numeric:tabular-nums]")}
              />
            </div>
            <div className="flex-1">
              <FieldLabel>Submissions per clipper</FieldLabel>
              <select
                name="submissionCapBase"
                value={subCap}
                onChange={(e) => setSubCap(e.target.value)}
                className={cn(well, "appearance-none")}
              >
                {[1, 2, 3, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* step 3. Creative & review */}
      <div className={cn("flex-col gap-3.5", step === 3 ? "flex" : "hidden")}>
        <GlassPanel className="flex flex-col gap-4 p-[22px]">
          <div>
            <FieldLabel>The brief</FieldLabel>
            <textarea
              name="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Post the supplied clip to your page. Hook in 2s, keep product name on screen…"
              className={cn(well, "min-h-[96px] resize-y leading-[1.5]")}
            />
          </div>
          <div>
            <FieldLabel>Rules · one per line (optional)</FieldLabel>
            <textarea
              name="guidelines"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder={"Keep the supplied audio\nNo political or edited-price claims"}
              className={cn(well, "min-h-[72px] resize-y leading-[1.5]")}
            />
          </div>
          <div>
            <p className="eyebrow mb-[9px]">Clip asset</p>
            <div className="flex flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[rgba(53,5,90,0.2)] p-5 text-center">
              <span className="text-violet-700">
                <IconUpload size={22} strokeWidth={1.4} />
              </span>
              <input
                name="sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://… link to the exact video clippers download and post"
                className={cn(well, "max-w-[420px] text-center")}
              />
            </div>
          </div>
        </GlassPanel>

        {/* review. The one ink surface */}
        <GlassPanel variant="ink" className="p-5">
          <span className="eyebrow text-[rgba(255,255,244,0.6)]">Review</span>
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3.5 text-[13px] sm:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,244,0.6)]">Budget</span>
              <span className="font-mono [font-variant-numeric:tabular-nums]">
                ৳{budgetNum.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,244,0.6)]">Rate</span>
              <span className="font-mono">৳60 / 1k</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,244,0.6)]">Min views</span>
              <span className="font-mono [font-variant-numeric:tabular-nums]">
                {minViews.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,244,0.6)]">Window</span>
              <span className="font-mono">7 days</span>
            </div>
          </div>
          <p className="mt-3.5 border-t border-[rgba(255,255,244,0.12)] pt-3 text-[12px] leading-[1.5] text-[rgba(255,255,244,0.65)]">
            On create, the campaign moves to <b className="text-yellow">Pending funding</b>. It goes
            live once an admin confirms your escrow deposit.
          </p>
        </GlassPanel>
      </div>

      {state.error ? (
        <p className="text-[13.5px] font-medium text-danger-600" role="alert">
          {state.error}
        </p>
      ) : null}

      {/* footer */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className={cn("h-11 border-none px-5 text-[14px]", step === 1 && "invisible")}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            className="h-11 px-6 text-[14px]"
          >
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={pending} className="h-11 px-6 text-[14px]">
            {pending ? "Creating…" : "Create → send to funding"}
          </Button>
        )}
      </div>
    </form>
  );
}
