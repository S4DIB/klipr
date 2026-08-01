"use client";

import { useActionState, useState } from "react";
import { Button, ArrowEast } from "@/components/ui/button";
import { BrandPreviewCard } from "./brand-preview-card";
import { VField } from "./violet-field";
import { finishBrandSetup, type BrandFinishState } from "./actions";

const EXPERIENCE = [
  { value: "not_yet", label: "Not yet" },
  { value: "a_few", label: "A few" },
  { value: "often", label: "Often" },
];

/** Brand step 3 — Finish your setup. */
export function FinishStep({
  businessName,
  website,
  industry,
  country,
  avatarUrl,
  email,
  firstName: initialFirst,
  lastName: initialLast,
  experience: initialExp,
  onBack,
}: {
  businessName: string;
  website: string;
  industry?: string;
  country?: string;
  avatarUrl?: string;
  email: string;
  firstName: string;
  lastName: string;
  experience: string;
  onBack: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<BrandFinishState, FormData>(
    finishBrandSetup,
    {},
  );
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [exp, setExp] = useState(initialExp || "");

  const personName = [first, last].filter(Boolean).join(" ").trim();

  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Finish your setup
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white">
        Last step — who runs this account.
      </p>

      <div className="mt-5">
        <BrandPreviewCard
          businessName={businessName}
          website={website}
          industry={industry}
          country={country}
          avatarUrl={avatarUrl}
          personName={personName}
          email={email}
          showContact
        />
      </div>

      <form action={action} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-white">
            What’s your name?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <VField
              label=""
              name="firstName"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="First"
              autoComplete="given-name"
              required
            />
            <VField
              label=""
              name="lastName"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Last"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-white">
            Have you run clipping campaigns in the past?
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE.map((e) => {
              const on = exp === e.value;
              return (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setExp(e.value)}
                  aria-pressed={on}
                  className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    on
                      ? "border-transparent bg-white text-violet-900"
                      : "border-white/30 text-white hover:border-white/60"
                  }`}
                >
                  {e.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="campaignExperience" value={exp} />
        </div>

        {state.error ? (
          <p className="text-[12.5px] font-semibold text-yellow">{state.error}</p>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          {onBack}
          <Button type="submit" variant="inverse" disabled={pending} className="flex-1">
            {pending ? "Finishing…" : "Complete"} <ArrowEast />
          </Button>
        </div>
      </form>
    </div>
  );
}
