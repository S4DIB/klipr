"use client";

import { useActionState } from "react";
import { completeOnboarding, type OnboardingState } from "@/app/onboarding/actions";
import { Button, ArrowEast } from "@/components/ui/button";

const PLATFORMS = ["TikTok", "Instagram", "YouTube"] as const;

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );

  return (
    <form action={action} className="space-y-6">
      {/* account type */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text-hi">
          How will you use Klipr?
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: "individual", t: "Individual", d: "I post to my own page(s)" },
            { v: "agency", t: "Agency", d: "I run many pages / clippers" },
          ].map((o, i) => (
            <label key={o.v} className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value={o.v}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <div className="rounded-xl border border-line bg-white p-4 transition-colors peer-checked:border-volt-500 peer-checked:bg-volt-500/5 peer-checked:ring-1 peer-checked:ring-volt-500">
                <p className="font-display font-semibold text-text-hi">{o.t}</p>
                <p className="mt-1 text-xs text-text-mid">{o.d}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Your name" name="displayName" defaultValue={defaultName} placeholder="Your name" />
      <Field label="Payout number (mobile wallet)" name="payoutNumber" placeholder="01XXXXXXXXX" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Page URL" name="pageUrl" placeholder="https://tiktok.com/@you" />
        <Field label="Handle" name="handle" placeholder="@yourpage" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Platform</Label>
          <select
            name="platform"
            defaultValue="TikTok"
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-text-hi outline-none focus:border-volt-500"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <Field label="Followers" name="followerCount" type="number" placeholder="10000" defaultValue="0" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" className="h-[52px] w-full" disabled={pending}>
        {pending ? "Saving…" : "Finish setup"}
        {!pending && <ArrowEast />}
      </Button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-sm font-medium text-text-hi">{children}</p>;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-xl border border-line bg-white px-3 text-text-hi outline-none placeholder:text-text-low focus:border-volt-500"
      />
    </div>
  );
}
