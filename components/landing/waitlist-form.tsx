"use client";

import { useRef, useState } from "react";
import { ArrowEast } from "@/components/ui/button";

/* Niche is picked PER PAGE now (spec §8) — one person may run a meme page and
   a sports page. */
const NICHES = [
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

const POST_FREQ = [
  "A few times a week",
  "About once a day",
  "A few times a day",
  "All day, every day",
];

const MAX_PAGES = 8;

type Page = { link: string; niche: string };
const emptyPage = (): Page => ({ link: "", niche: "" });

/* Control styling per surface: light (ivory page), dark (amethyst glass),
   glass (visionOS-style neutral smoked glass) */
const THEMES = {
  light: {
    input:
      "focus-quiet h-12 w-full rounded-xl border border-line bg-white/80 px-4 text-[15px] text-text-hi placeholder:text-text-low focus:border-volt-500 focus:outline-none [&>option]:text-text-hi",
    label: "mb-1.5 block text-left text-sm font-medium text-text-mid",
    toggleWrap: "border border-line bg-white/70",
    toggleIdle: "text-text-mid hover:text-text-hi",
    toggleActive: "bg-volt-600 text-yellow",
    card: "border border-line bg-white/60",
    addBtn:
      "border-volt-500/40 text-volt-500 hover:border-volt-500 hover:bg-volt-500/5",
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
    card: "border border-white/15 bg-white/[0.07]",
    addBtn: "border-yellow/40 text-yellow hover:border-yellow hover:bg-yellow/10",
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
    card: "border border-white/20 bg-white/10",
    addBtn: "border-white/40 text-white hover:border-white/70 hover:bg-white/10",
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

/** Pre-launch capture — ONE step each (spec §8). Clippers paste their page
 *  links + pick a niche per page + say how often they post; brands leave
 *  company details. Stored via /api/waitlist. */
export function WaitlistForm({
  autoFocusFirst,
  variant = "light",
  initialRole = "clipper",
}: {
  autoFocusFirst?: boolean;
  variant?: Variant;
  initialRole?: "clipper" | "brand";
}) {
  const t = THEMES[variant];
  const [role, setRole] = useState<"clipper" | "brand">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pages, setPages] = useState<Page[]>([emptyPage()]);
  const [postFrequency, setPostFrequency] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real users leave this empty
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function setPage(i: number, patch: Partial<Page>) {
    setPages((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setError(null);
    if (formRef.current && !formRef.current.reportValidity()) return;
    if (role === "clipper") {
      if (pages.some((p) => !p.niche)) {
        setError("Pick a niche for each page.");
        return;
      }
    }
    setState("busy");
    const source = readSource(); // which ad/campaign this signup came from
    const payload =
      role === "brand"
        ? { role, name, email, phone, company, designation, website, source }
        : { role, name, email, phone, pages, postFrequency, website, source };
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

  const submitLabel = state === "busy" ? "Joining…" : "Join the waitlist";

  return (
    <form ref={formRef} onSubmit={submit} className="mx-auto w-full max-w-md text-left">
      {/* honeypot — off-screen, not tabbable, hidden from AT; bots fill it, humans don't */}
      <input
        type="text"
        name="contact_time"
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

      <div className="space-y-4">
        {/* shared: name, email, phone */}
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
        <div className="grid gap-4 sm:grid-cols-2">
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
              Phone
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
        </div>

        {role === "brand" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`wl-${variant}-company`} className={t.label}>
                Company name
              </label>
              <input
                id={`wl-${variant}-company`}
                type="text"
                required
                maxLength={100}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company"
                className={t.input}
              />
            </div>
            <div>
              <label htmlFor={`wl-${variant}-designation`} className={t.label}>
                Your role
              </label>
              <input
                id={`wl-${variant}-designation`}
                type="text"
                required
                maxLength={80}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Founder, Marketing lead"
                className={t.input}
              />
            </div>
          </div>
        ) : (
          <>
            {/* clipper: paste page links + a niche per page */}
            <div>
              <label className={t.label}>Your pages — paste the link, pick a niche</label>
              <div className="space-y-2.5">
                {pages.map((p, i) => (
                  <div key={i} className={`relative rounded-xl p-2.5 ${t.card}`}>
                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPages((ps) => ps.filter((_, j) => j !== i))}
                        aria-label={`Remove page ${i + 1}`}
                        className={`absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full shadow ${t.remove}`}
                      >
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M2 2l10 10M12 2 2 12" />
                        </svg>
                      </button>
                    )}
                    <div className="grid gap-2.5 sm:grid-cols-[1.5fr_1fr]">
                      <input
                        type="url"
                        required
                        maxLength={200}
                        aria-label="Page link"
                        value={p.link}
                        onChange={(e) => setPage(i, { link: e.target.value })}
                        placeholder="Paste your page link"
                        className={t.input}
                      />
                      <select
                        required
                        aria-label="Niche"
                        value={p.niche}
                        onChange={(e) => setPage(i, { niche: e.target.value })}
                        className={`${t.input} appearance-none ${p.niche ? "" : t.ghost}`}
                      >
                        <option value="" disabled>
                          Niche
                        </option>
                        {NICHES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              {pages.length < MAX_PAGES && (
                <button
                  type="button"
                  onClick={() => setPages((ps) => [...ps, emptyPage()])}
                  className={`mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-medium transition-colors ${t.addBtn}`}
                >
                  <span className="text-base leading-none">+</span> Add another page
                </button>
              )}
            </div>

            <div>
              <label htmlFor={`wl-${variant}-freq`} className={t.label}>
                How often do you post?
              </label>
              <select
                id={`wl-${variant}-freq`}
                required
                value={postFrequency}
                onChange={(e) => setPostFrequency(e.target.value)}
                className={`${t.input} appearance-none ${postFrequency ? "" : t.ghost}`}
              >
                <option value="" disabled>
                  Choose one
                </option>
                {POST_FREQ.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={state === "busy"}
          className={`group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition-all duration-200 disabled:opacity-60 ${t.primary}`}
        >
          {submitLabel}
          <ArrowEast />
        </button>
      </div>

      {error && <p className={`mt-3 text-sm ${t.error}`}>{error}</p>}
    </form>
  );
}
