"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/app/status-chip";
import { TierBadge, type TierName } from "@/components/app/tier-badge";
import { NidForm } from "@/app/(app)/wallet/wallet-forms";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";
import {
  updateProfileInfo,
  updatePayoutMethod,
  updateNotifications,
  type SettingsState,
} from "./actions";

type Tab = "personal" | "payout" | "notifications" | "identity" | "close";

const TABS: { key: Tab; label: string }[] = [
  { key: "personal", label: "Personal info" },
  { key: "payout", label: "Payout methods" },
  { key: "notifications", label: "Notifications" },
  { key: "identity", label: "Identity" },
  { key: "close", label: "Close account" },
];

export interface PersonalInfo {
  displayName: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  location?: string;
  postLanguages?: string;
}

export function SettingsTabs({
  personal,
  email,
  tier,
  bkashNumber,
  leaderboardOptOut,
  nidStatus,
}: {
  personal: PersonalInfo;
  email: string;
  tier: TierName;
  bkashNumber?: string;
  leaderboardOptOut: boolean;
  nidStatus: "none" | "submitted" | "verified";
}) {
  const [tab, setTab] = useState<Tab>("personal");
  const initial = (personal.displayName || "K").trim().charAt(0).toUpperCase();

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
          {tab === "personal" && (
            <PersonalPanel personal={personal} email={email} tier={tier} initial={initial} />
          )}
          {tab === "payout" && <PayoutPanel bkashNumber={bkashNumber} />}
          {tab === "notifications" && <NotificationsPanel leaderboardOptOut={leaderboardOptOut} />}
          {tab === "identity" && <IdentityPanel nidStatus={nidStatus} />}
          {tab === "close" && <ClosePanel />}
        </div>
      </div>
    </div>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[20px] font-extrabold tracking-[-0.01em] text-ink-900">{children}</h2>
  );
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

function PersonalPanel({
  personal,
  email,
  tier,
  initial,
}: {
  personal: PersonalInfo;
  email: string;
  tier: TierName;
  initial: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfileInfo, {});
  // Seed first/last from displayName the first time (before the user has split them).
  const [first, ...restName] = (personal.displayName || "").trim().split(/\s+/);
  const seededFirst = personal.firstName ?? first ?? "";
  const seededLast = personal.lastName ?? restName.join(" ");

  return (
    <form action={action} className="flex flex-col gap-6">
      <PanelHeading>Personal info</PanelHeading>

      {/* identity header */}
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-volt-600 font-mono text-[24px] text-yellow">
          {initial}
        </span>
        <div>
          <p className="text-[20px] font-extrabold tracking-[-0.01em] text-ink-900">
            {personal.displayName}
          </p>
          <div className="mt-1">
            <TierBadge tier={tier} size="sm" />
          </div>
        </div>
      </div>

      {/* first / last */}
      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="First name" name="firstName" defaultValue={seededFirst} required />
          <TextField label="Last name" name="lastName" defaultValue={seededLast} />
        </div>
      </div>

      {/* username */}
      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <label htmlFor="f-username" className="mb-1.5 block text-[13px] font-medium text-ink-900">
          Username
        </label>
        <div className="glass-well flex items-center gap-1 px-3.5 py-2.5 transition-colors focus-within:border-[rgba(125,4,215,0.5)]">
          <span className="text-[14px] text-ink-400">@</span>
          <input
            id="f-username"
            name="username"
            defaultValue={personal.username}
            placeholder="yourhandle"
            className="focus-quiet w-full bg-transparent text-[14px] text-ink-900 placeholder:text-ink-400"
          />
        </div>
      </div>

      {/* location */}
      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <TextField
          label="Location"
          name="location"
          defaultValue={personal.location}
          placeholder="Country or city"
        />
      </div>

      {/* languages */}
      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <TextField
          label="Languages you post in"
          name="postLanguages"
          defaultValue={personal.postLanguages}
          placeholder="e.g. Bangla, English"
        />
      </div>

      {/* email (read-only) */}
      <div className="border-t border-[rgba(53,5,90,0.08)] pt-5">
        <p className="mb-1.5 text-[13px] font-medium text-ink-900">Email</p>
        <div className="glass-well px-3.5 py-2.5 text-[14px] text-ink-500">{email}</div>
        <p className="mt-1.5 text-[12px] text-ink-400">
          Your login email. Contact support to change it.
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

function PayoutPanel({ bkashNumber }: { bkashNumber?: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updatePayoutMethod, {});
  return (
    <div className="flex flex-col gap-6">
      <PanelHeading>Payout methods</PanelHeading>
      <form action={action} className="flex flex-col gap-4">
        <TextField
          label="bKash number"
          hint="where payouts land"
          name="bkashNumber"
          inputMode="numeric"
          placeholder="01XXXXXXXXX"
          defaultValue={bkashNumber}
        />
        <p className="rounded-[12px] bg-[rgba(53,5,90,0.04)] px-3.5 py-3 text-[12.5px] leading-[1.5] text-ink-600">
          bKash is the payout method today. International options are on the way.
        </p>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="h-11 px-6 text-[14px]">
            {pending ? "Saving…" : "Save payout method"}
          </Button>
          <SaveResult state={state} />
        </div>
      </form>
    </div>
  );
}

function NotificationsPanel({ leaderboardOptOut }: { leaderboardOptOut: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateNotifications, {});
  return (
    <div className="flex flex-col gap-6">
      <PanelHeading>Notifications</PanelHeading>
      <form action={action} className="flex flex-col gap-4">
        <label className="glass-well flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5">
          <span>
            <span className="block text-[13.5px] font-bold text-ink-900">
              Hide me from the leaderboard
            </span>
            <span className="mt-0.5 block text-[12px] text-ink-500">
              Your earnings stay private either way. Only settled views rank.
            </span>
          </span>
          <input
            type="checkbox"
            name="leaderboardOptOut"
            defaultChecked={leaderboardOptOut}
            className="peer sr-only"
          />
          <span className="relative h-[28px] w-[46px] shrink-0 rounded-full bg-ink-200 transition-colors peer-checked:bg-violet-600 peer-focus-visible:outline-2 peer-focus-visible:outline-violet-500 [&>span]:absolute [&>span]:left-[3px] [&>span]:top-[3px] [&>span]:h-[22px] [&>span]:w-[22px] [&>span]:rounded-full [&>span]:bg-white [&>span]:shadow-[var(--shadow-sm)] [&>span]:transition-transform peer-checked:[&>span]:translate-x-[18px]">
            <span />
          </span>
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="h-11 px-6 text-[14px]">
            {pending ? "Saving…" : "Save preferences"}
          </Button>
          <SaveResult state={state} />
        </div>
      </form>
    </div>
  );
}

function IdentityPanel({ nidStatus }: { nidStatus: "none" | "submitted" | "verified" }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <PanelHeading>Identity (NID)</PanelHeading>
        <StatusChip
          status={nidStatus === "none" ? "pending" : nidStatus}
          label={nidStatus === "none" ? "Not submitted" : undefined}
        />
      </div>
      <p className="text-[13px] leading-relaxed text-ink-500">
        Verified once before your first payout releases. Stored encrypted; never shown in full.
      </p>
      {nidStatus === "none" ? (
        <div className="mt-1">
          <NidForm />
        </div>
      ) : (
        <p className="rounded-[12px] bg-[rgba(53,5,90,0.04)] px-3.5 py-3 text-[12.5px] text-ink-600">
          {nidStatus === "submitted"
            ? "Your NID is under review. Payouts release once a reviewer verifies it."
            : "Your identity is verified. Payouts can release normally."}
        </p>
      )}
    </div>
  );
}

function ClosePanel() {
  return (
    <div className="flex flex-col gap-4">
      <PanelHeading>Close account</PanelHeading>
      <p className="text-[13px] leading-relaxed text-ink-500">
        Signing out ends this session. To permanently delete your account and data, contact the
        Klipr team — we&rsquo;ll confirm any pending payouts first.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="secondary" className="h-11 px-6 text-[14px]">
          Sign out
        </Button>
      </form>
    </div>
  );
}
