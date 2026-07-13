"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { ArrowEast } from "@/components/ui/button";

const PLATFORMS = [
  ["tiktok", "TikTok"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["youtube", "YouTube"],
] as const;

const CATEGORIES = [
  "Memes",
  "Sports",
  "Entertainment",
  "Food",
  "Music",
  "Tech",
  "Gaming",
  "Fashion",
  "News",
  "Motivation",
  "Education",
  "Other",
];

const MAX_HANDLES = 8;
const STEPS = ["About you", "Your niche", "Your pages"];

type Handle = { platform: string; handle: string; followers: string; kind: string };

const emptyHandle = (): Handle => ({
  platform: "",
  handle: "",
  followers: "",
  kind: "page",
});

/* Control styling per surface: light (ivory page), dark (amethyst glass),
   glass (visionOS-style neutral smoked glass) */
const THEMES = {
  light: {
    input:
      "focus-quiet h-12 w-full rounded-xl border border-line bg-white/80 px-4 text-[15px] text-text-hi placeholder:text-text-low focus:border-volt-500 focus:outline-none",
    label: "mb-1.5 block text-left text-sm font-medium text-text-mid",
    toggleWrap: "border border-line bg-white/70",
    toggleIdle: "text-text-mid hover:text-text-hi",
    toggleActive: "bg-volt-600 text-yellow",
    stepTitle: "text-text-hi",
    stepCount: "text-text-mid",
    barBase: "bg-volt-600/12",
    barFill: "bg-volt-500",
    chipIdle:
      "border border-line bg-white/70 text-text-mid hover:border-volt-500/50 hover:text-text-hi",
    chipActive: "bg-volt-600 text-yellow",
    card: "border border-line bg-white/60",
    addBtn:
      "border-volt-500/40 text-volt-500 hover:border-volt-500 hover:bg-volt-500/5",
    back: "border border-line text-text-mid hover:border-volt-500/50 hover:text-text-hi",
    primary: "bg-volt-500 text-white hover:bg-volt-400",
    remove: "bg-volt-600 text-white",
    ghost: "text-text-low",
    error: "text-[#c0392b]",
    success: "border border-ok/30 bg-ok/10",
    successText: "text-text-hi",
    check: "#0a8f4f",
  },
  dark: {
    input:
      "focus-quiet h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-[15px] text-white placeholder:text-white/40 focus:border-yellow/70 focus:outline-none [&>option]:text-text-hi",
    label: "mb-1.5 block text-left text-sm font-medium text-white/70",
    toggleWrap: "border border-white/15 bg-white/10",
    toggleIdle: "text-white/65 hover:text-white",
    toggleActive: "bg-volt-600 text-yellow",
    stepTitle: "text-white",
    stepCount: "text-white/50",
    barBase: "bg-white/15",
    barFill: "bg-yellow",
    chipIdle:
      "border border-white/15 bg-white/10 text-white/75 hover:border-yellow/50 hover:text-white",
    chipActive: "bg-yellow text-volt-600",
    card: "border border-white/15 bg-white/[0.07]",
    addBtn: "border-yellow/40 text-yellow hover:border-yellow hover:bg-yellow/10",
    back: "border border-white/20 text-white/70 hover:border-white/40 hover:text-white",
    primary: "bg-volt-500 text-white hover:bg-volt-400",
    remove: "bg-volt-600 text-white",
    ghost: "text-white/40",
    error: "text-[#ffb0a8]",
    success: "border border-mint/40 bg-mint/10",
    successText: "text-white",
    check: "#14f9c5",
  },
  glass: {
    input:
      "focus-quiet h-12 w-full rounded-xl border border-white/25 bg-white/15 px-4 text-[15px] text-white placeholder:text-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] focus:border-white/70 focus:outline-none [&>option]:text-text-hi",
    label: "mb-1.5 block text-left text-sm font-medium text-white/85",
    toggleWrap: "border border-white/15 bg-black/25",
    toggleIdle: "text-white/85 hover:text-white",
    toggleActive: "bg-white text-[#1d1d1f] shadow-sm",
    stepTitle: "text-white",
    stepCount: "text-white/65",
    barBase: "bg-white/25",
    barFill:
      "bg-[#30e158] shadow-[0_0_5px_rgba(48,225,88,0.55),0_0_10px_rgba(48,225,88,0.3)]",
    chipIdle:
      "border border-white/20 bg-white/12 text-white/90 hover:bg-white/25 hover:text-white",
    chipActive: "bg-white text-[#1d1d1f] shadow-sm",
    card: "border border-white/20 bg-white/10",
    addBtn: "border-white/40 text-white hover:border-white/70 hover:bg-white/10",
    back: "border border-white/25 text-white/90 hover:border-white/50 hover:text-white",
    primary: "bg-white text-[#1d1d1f] hover:bg-white/85",
    remove: "bg-[#2c2c2e]/90 text-white",
    ghost: "text-white/55",
    error: "text-[#ffc9c2]",
    success: "border border-white/30 bg-white/15",
    successText: "text-white",
    check: "#ffffff",
  },
} as const;

type Variant = keyof typeof THEMES;

/** Ad/campaign attribution: the UTM params on the landing URL (set by your ad
 *  links), or the referring host as a fallback. Shows up in the leads export. */
function readSource(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const p = new URLSearchParams(window.location.search);
    const utm = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((k) => {
        const v = p.get(k);
        return v ? `${k}=${v}` : null;
      })
      .filter(Boolean)
      .join("&");
    if (utm) return utm.slice(0, 200);
    if (document.referrer) return `ref=${new URL(document.referrer).host}`.slice(0, 200);
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Pre-launch capture — brands leave an email; clippers walk a 3-step wizard
 *  (about you → niche → pages & reach). Stored via /api/waitlist. */
export function WaitlistForm({
  autoFocusFirst,
  variant = "light",
}: {
  autoFocusFirst?: boolean;
  variant?: Variant;
}) {
  const t = THEMES[variant];
  const [role, setRole] = useState<"clipper" | "brand">("clipper");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [handles, setHandles] = useState<Handle[]>([emptyHandle()]);
  const [website, setWebsite] = useState(""); // honeypot — real users leave this empty
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const reduce = useReducedMotion();

  const slide = reduce
    ? {}
    : {
        initial: { opacity: 0, x: 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 },
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
      };

  function setHandle(i: number, patch: Partial<Handle>) {
    setHandles((hs) => hs.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  }

  function next() {
    setError(null);
    if (formRef.current && !formRef.current.reportValidity()) return;
    if (step === 1 && !category) {
      setError("Pick the category you clip in.");
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (role === "clipper" && step < 2) {
      next();
      return;
    }
    if (state === "busy") return;
    setState("busy");
    setError(null);
    const source = readSource(); // which ad/campaign this signup came from
    const payload =
      role === "brand"
        ? { role, email, website, source }
        : { role, email, name, phone, category, handles, website, source };
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setState("done");
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong — try again.");
        setState("error");
      }
    } catch {
      setError("Something went wrong — try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        className={`mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl px-6 py-5 ${t.success}`}
      >
        <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2.5 7.5 6 11l5.5-7" stroke={t.check} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className={t.successText}>
          You&rsquo;re on the list — we&rsquo;ll email you at launch.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="mx-auto w-full max-w-md text-left">
      {/* honeypot — off-screen, not tabbable, hidden from AT; bots fill it, humans don't */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* who are you — clipper or brand */}
      <div className="mb-5 flex justify-center">
        <div className={`inline-flex rounded-full p-1 ${t.toggleWrap}`}>
          {(["clipper", "brand"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setStep(0);
                setError(null);
              }}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                role === r ? t.toggleActive : t.toggleIdle
              }`}
            >
              {r === "clipper" ? "I'm a clipper" : "I'm a brand"}
            </button>
          ))}
        </div>
      </div>

      {role === "brand" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor={`wl-${variant}-brand-email`} className={t.label}>
              Email
            </label>
            <input
              id={`wl-${variant}-brand-email`}
              type="email"
              required
              autoFocus={autoFocusFirst}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={t.input}
            />
          </div>
          <button
            type="submit"
            disabled={state === "busy"}
            className={`group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition-all duration-200 disabled:opacity-60 ${t.primary}`}
          >
            {state === "busy" ? "Joining…" : "Join the waitlist"}
            <ArrowEast />
          </button>
        </div>
      ) : (
        <>
          {/* progress — step n of 3 */}
          <div className="mb-5">
            <div className="mb-2 flex items-baseline justify-between">
              <p className={`text-sm font-semibold ${t.stepTitle}`}>
                {STEPS[step]}
              </p>
              <p className={`font-mono text-[11px] uppercase tracking-wider ${t.stepCount}`}>
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    i <= step ? t.barFill : t.barBase
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {step === 0 && (
                <motion.div key="s0" className="space-y-4" {...slide}>
                  <div>
                    <label htmlFor={`wl-${variant}-name`} className={t.label}>
                      Name
                    </label>
                    <input
                      id={`wl-${variant}-name`}
                      type="text"
                      required
                      maxLength={100}
                      autoFocus={autoFocusFirst}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={t.input}
                    />
                  </div>
                  <div>
                    <label htmlFor={`wl-${variant}-email`} className={t.label}>
                      Email
                    </label>
                    <input
                      id={`wl-${variant}-email`}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={t.input}
                    />
                  </div>
                  <div>
                    <label htmlFor={`wl-${variant}-phone`} className={t.label}>
                      Phone number
                    </label>
                    <input
                      id={`wl-${variant}-phone`}
                      type="tel"
                      required
                      maxLength={20}
                      pattern="\+?[\d\s()-]{6,20}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className={t.input}
                    />
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" {...slide}>
                  <p className={t.label}>What do you clip?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCategory(c);
                          setError(null);
                        }}
                        className={`h-11 rounded-xl text-sm font-medium transition-colors ${
                          category === c ? t.chipActive : t.chipIdle
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" {...slide}>
                  <p className={t.label}>Your pages & profiles</p>
                  <div className="space-y-3">
                    {handles.map((h, i) => (
                      <div key={i} className={`relative rounded-xl p-3 ${t.card}`}>
                        {handles.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setHandles((hs) => hs.filter((_, j) => j !== i))
                            }
                            aria-label={`Remove handle ${i + 1}`}
                            className={`absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full shadow ${t.remove}`}
                          >
                            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <path d="M2 2l10 10M12 2 2 12" />
                            </svg>
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-2.5">
                          <select
                            required
                            aria-label="Platform"
                            value={h.platform}
                            onChange={(e) => setHandle(i, { platform: e.target.value })}
                            className={`${t.input} appearance-none ${
                              h.platform ? "" : t.ghost
                            }`}
                          >
                            <option value="" disabled>
                              Platform
                            </option>
                            {PLATFORMS.map(([v, label]) => (
                              <option key={v} value={v}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <select
                            aria-label="Page or profile"
                            value={h.kind}
                            onChange={(e) => setHandle(i, { kind: e.target.value })}
                            className={`${t.input} appearance-none`}
                          >
                            <option value="page">Page</option>
                            <option value="profile">Profile</option>
                          </select>
                          <input
                            type="text"
                            required
                            maxLength={100}
                            aria-label="Handle"
                            value={h.handle}
                            onChange={(e) => setHandle(i, { handle: e.target.value })}
                            placeholder="@yourhandle"
                            className={t.input}
                          />
                          <input
                            type="number"
                            required
                            min={0}
                            max={1000000000}
                            aria-label="Followers"
                            value={h.followers}
                            onChange={(e) => setHandle(i, { followers: e.target.value })}
                            placeholder="Followers"
                            className={t.input}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {handles.length < MAX_HANDLES && (
                    <button
                      type="button"
                      onClick={() => setHandles((hs) => [...hs, emptyHandle()])}
                      className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-medium transition-colors ${t.addBtn}`}
                    >
                      <span className="text-base leading-none">+</span> Add
                      another handle
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* wizard controls */}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
                className={`inline-flex h-[52px] items-center justify-center rounded-full px-6 text-[15px] font-medium transition-colors ${t.back}`}
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={next}
                className={`group inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition-all duration-200 ${t.primary}`}
              >
                Next
                <ArrowEast />
              </button>
            ) : (
              <button
                type="submit"
                disabled={state === "busy"}
                className={`group inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition-all duration-200 disabled:opacity-60 ${t.primary}`}
              >
                {state === "busy" ? "Finishing…" : "Finish"}
                <ArrowEast />
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className={`mt-3 text-sm ${t.error}`}>{error}</p>}
    </form>
  );
}
