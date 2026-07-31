"use client";

import { useActionState, useState } from "react";
import { Button, ArrowEast } from "@/components/ui/button";
import { PreviewCard } from "./preview-card";
import { VField, VLocked } from "./violet-field";
import { saveProfile, type ProfileState } from "./actions";

/**
 * Step 1 — Make your profile. Name + username drive the live preview; mobile &
 * email are locked (drawn from the waitlist). Single column on the violet card.
 */
export function ProfileStep({
  avatarUrl,
  firstName: initialFirst,
  lastName: initialLast,
  username: initialUsername,
  mobile,
  email,
}: {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  username: string;
  mobile?: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [username, setUsername] = useState(initialUsername);

  const name = [first, last].filter(Boolean).join(" ").trim();

  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Make your profile
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white">
        This is how brands and the leaderboard will see you.
      </p>

      <div className="mt-5">
        <PreviewCard avatarUrl={avatarUrl} name={name} username={username} />
      </div>

      <form action={action} className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <VField
            label="First name"
            name="firstName"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="Shah"
            autoComplete="given-name"
            error={state.field === "firstName" ? state.error : undefined}
            required
          />
          <VField
            label="Last name"
            name="lastName"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Sadib"
            autoComplete="family-name"
          />
        </div>

        <VField
          label="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
          placeholder="sadib"
          autoCapitalize="none"
          spellCheck={false}
          error={state.field === "username" ? state.error : undefined}
          required
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <VLocked label="Mobile number" value={mobile || "Not provided"} muted={!mobile} />
          <VLocked label="Email" value={email} />
        </div>
        <p className="text-[12px] text-white">
          Mobile and email come from your waitlist application and can&rsquo;t be changed here.
        </p>

        <div className="pt-1">
          <Button type="submit" variant="inverse" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Continue"} <ArrowEast />
          </Button>
        </div>
      </form>
    </div>
  );
}
