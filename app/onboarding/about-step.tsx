"use client";

import { useActionState, useState } from "react";
import { Button, ArrowEast } from "@/components/ui/button";
import { PreviewCard } from "./preview-card";
import { VSelect } from "./violet-field";
import { saveAbout, type AboutState } from "./actions";
import { COUNTRIES } from "./options";

const LANGUAGES = ["Bangla", "English", "Hindi", "Urdu", "Arabic", "Other"];

/**
 * Step 2 — Tell us about yourself. Location + the languages they post in, both
 * feeding the live preview. Single column on the violet card.
 */
export function AboutStep({
  avatarUrl,
  name,
  username,
  location: initialLocation,
  languages: initialLanguages,
  onBack,
}: {
  avatarUrl?: string;
  name: string;
  username: string;
  location: string;
  languages: string[];
  onBack: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<AboutState, FormData>(saveAbout, {});
  const [location, setLocation] = useState(initialLocation || "");
  const [langs, setLangs] = useState<string[]>(initialLanguages);

  const toggle = (l: string) =>
    setLangs((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));

  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Tell us about yourself
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white">
        This helps us match you with the best campaigns.
      </p>

      <div className="mt-5">
        <PreviewCard
          avatarUrl={avatarUrl}
          name={name}
          username={username}
          location={location}
          languages={langs}
        />
      </div>

      <form action={action} className="mt-5 space-y-5">
        <VSelect
          label="Your location"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </VSelect>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-white">
            What languages do you post in?
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const on = langs.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggle(l)}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    on
                      ? "border-transparent bg-white text-violet-900"
                      : "border-white/30 text-white hover:border-white/60 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          {langs.map((l) => (
            <input key={l} type="hidden" name="languages" value={l} />
          ))}
          {state.error ? (
            <p className="mt-2 text-[12.5px] font-semibold text-yellow">{state.error}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 pt-1">
          {onBack}
          <Button type="submit" variant="inverse" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Continue"} <ArrowEast />
          </Button>
        </div>
      </form>
    </div>
  );
}
