"use client";

import { useActionState, useState } from "react";
import { TextField, SelectField } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { COUNTRIES, INDUSTRIES, SPEND } from "@/app/onboarding/options";
import { updateBrandCompany, type SettingsState } from "./actions";

export interface BrandInfo {
  orgName: string;
  website?: string;
  industry?: string;
  location?: string;
  monthlySpend?: string;
  logoUrl?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export function PanelHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[20px] font-extrabold tracking-[-0.01em] text-ink-900">{children}</h2>;
}

export function SaveResult({ state }: { state: SettingsState }) {
  if (state.error)
    return (
      <p className="text-[13px] font-medium text-danger-600" role="alert">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="text-[13px] text-success-600">Saved.</p>;
  return null;
}

export function CompanyPanel({ brand }: { brand: BrandInfo }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateBrandCompany, {});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const initial = (brand.orgName || "K").trim().charAt(0).toUpperCase();
  const shown = logoPreview ?? brand.logoUrl;

  return (
    <form action={action} className="flex flex-col gap-6">
      <PanelHeading>Company</PanelHeading>

      {/* logo */}
      <div className="flex items-center gap-4">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt=""
            className="h-16 w-16 shrink-0 rounded-[16px] object-cover ring-1 ring-[rgba(53,5,90,0.1)]"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-volt-600 font-mono text-[24px] text-yellow">
            {initial}
          </span>
        )}
        <div>
          <label className="inline-block cursor-pointer rounded-[12px] border border-line px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:border-volt-400 hover:text-volt-600">
            <input
              type="file"
              name="logo"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setLogoPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            Change logo
          </label>
          <p className="mt-1.5 text-[12px] text-ink-400">PNG or JPG.</p>
        </div>
      </div>

      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <TextField label="Company name" name="orgName" defaultValue={brand.orgName} required />
      </div>

      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <TextField
          label="Website"
          name="website"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={brand.website}
          placeholder="yourcompany.com"
        />
      </div>

      <div className="grid gap-4 border-t border-[rgba(53,5,90,0.08)] pt-5 sm:grid-cols-2">
        <SelectField label="Industry" name="industry" defaultValue={brand.industry ?? ""}>
          <option value="">Select industry</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </SelectField>
        <SelectField label="Country" name="location" defaultValue={brand.location ?? ""}>
          <option value="">Select country</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <SelectField
          label="Typical monthly spend"
          name="monthlySpend"
          defaultValue={brand.monthlySpend ?? ""}
        >
          <option value="">Prefer not to say</option>
          {SPEND.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11 px-6 text-[14px]">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <SaveResult state={state} />
      </div>
    </form>
  );
}
