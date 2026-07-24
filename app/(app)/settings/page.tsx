import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import { SettingsTabs } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireActiveClipper();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">Settings</h1>
      <SettingsTabs
        personal={{
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          location: user.location,
          postLanguages: user.postLanguages,
        }}
        email={user.email}
        tier={user.tier}
        bkashNumber={user.bkashNumber}
        leaderboardOptOut={user.leaderboardOptOut}
        nidStatus={user.nidStatus}
      />
    </div>
  );
}
