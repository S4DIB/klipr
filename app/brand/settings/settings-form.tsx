"use client";

import { useActionState, useState } from "react";
import { TextField, SelectField } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";
import { COUNTRIES, INDUSTRIES, SPEND } from "@/app/onboarding/options";
import { updateBrandCompany, updateBrandContact, type SettingsState } from "./actions";

type Tab = "company" | "contact" | "close";

const TABS: { key: Tab; label: string }[] = [
  { key: "company", label: "Company" },
  { key: "contact", label: "Contact" },
  { key: "close", label: "Close account" },
];

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

export function BrandSettingsTabs({ brand }: { brand: BrandInfo }) {
  const [tab, setTab] = useState<Tab>("company");

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
      {/* left tab rail */}
      <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-[200px] lg:flex-col lg:overflow-visible">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap rounded-[12px] px-4 py-2.5 text-left text-[14px] font-semibold transition-colors",
              tab === t.key
                ? "bg-white text-ink-900 shadow-[var(--shadow-xs)]"
                : t.key === "close"
                  ? "text-danger-600 hover:bg-[rgba(211,58,74,0.06)]"
                  : "text-ink-500 hover:bg-[rgba(53,5,90,0.05)] hover:text-ink-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* right panel */}
      <div className="min-w-0 flex-1">
        <div className="rounded-[22px] bg-white p-6 shadow-[0_1px_2px_rgba(31,3,53,0.04)] sm:p-7">
          {tab === "company" && <CompanyPanel brand={brand} />}
          {tab === "contact" && <ContactPanel brand={brand} />}
          {tab === "close" && <ClosePanel />}
        </div>
      </div>
    </div>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[20px] font-extrabold tracking-[-0.01em] text-ink-900">{children}</h2>;
}

function SaveResult({ state }: { state: SettingsState }) {
  if (state.error)
    return (
      <p className="text-[13px] font-medium text-danger-600" role="alert">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="text-[13px] text-success-600">Saved.</p>;
  return null;
}

function CompanyPanel({ brand }: { brand: BrandInfo }) {
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

function ContactPanel({ brand }: { brand: BrandInfo }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateBrandContact, {});
  // Seed first/last from displayName the first time (before the user split them).
  const [first, ...restName] = (brand.displayName || "").trim().split(/\s+/);
  const seededFirst = brand.firstName ?? first ?? "";
  const seededLast = brand.lastName ?? restName.join(" ");

  return (
    <form action={action} className="flex flex-col gap-6">
      <PanelHeading>Contact</PanelHeading>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="First name" name="firstName" defaultValue={seededFirst} required />
        <TextField label="Last name" name="lastName" defaultValue={seededLast} />
      </div>

      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <p className="mb-1.5 text-[13px] font-medium text-ink-900">Email</p>
        <div className="glass-well px-3.5 py-2.5 text-[14px] text-ink-500">{brand.email}</div>
        <p className="mt-1.5 text-[12px] text-ink-400">
          Your login email. Contact the Klipr team to change it.
        </p>
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

function ClosePanel() {
  return (
    <div className="flex flex-col gap-4">
      <PanelHeading>Close account</PanelHeading>
      <p className="text-[13px] leading-relaxed text-ink-500">
        Signing out ends this session. To permanently delete your brand account and data, contact
        the Klipr team — we&rsquo;ll settle any open campaigns first.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="secondary" className="h-11 px-6 text-[14px]">
          Sign out
        </Button>
      </form>
    </div>
  );
}
