"use client";

import { useActionState } from "react";
import { TextField } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { TierBadge, type TierName } from "@/components/app/tier-badge";
import { updateProfileInfo, type SettingsState } from "./actions";

export interface PersonalInfo {
  displayName: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  location?: string;
  postLanguages?: string;
}

export function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[20px] font-extrabold tracking-[-0.01em] text-ink-900">{children}</h2>
  );
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

/**
 * Personal info form — name, username, location, languages, read-only email.
 * Shared by /settings (its "Personal info" tab) and /profile, which already
 * carries the avatar/name/tier in its header and so passes showIdentity={false}.
 */
export function PersonalPanel({
  personal,
  email,
  tier,
  initial,
  showIdentity = true,
}: {
  personal: PersonalInfo;
  email: string;
  tier: TierName;
  initial: string;
  showIdentity?: boolean;
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
      {showIdentity ? (
        <div className="flex items-center gap-4">
          {personal.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={personal.avatarUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-[rgba(53,5,90,0.1)]"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-volt-600 font-mono text-[24px] text-yellow">
              {initial}
            </span>
          )}
          <div>
            <p className="text-[20px] font-extrabold tracking-[-0.01em] text-ink-900">
              {personal.displayName}
            </p>
            <div className="mt-1">
              <TierBadge tier={tier} size="sm" />
            </div>
          </div>
        </div>
      ) : null}

      {/* first / last */}
      <div className={showIdentity ? "border-t border-[rgba(53,5,90,0.08)] pt-5" : ""}>
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
