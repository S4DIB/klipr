import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { GlassPanel } from "@/components/app/glass-panel";

export const metadata: Metadata = { title: "Brand settings" };

export default async function BrandSettingsPage() {
  const user = await requireRole("brand");
  return (
    <div className="max-w-xl space-y-6">
      <header>
        <p className="eyebrow">01 / Settings</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">Your organisation.</h1>
      </header>
      <GlassPanel className="space-y-4 p-6">
        <div>
          <p className="eyebrow mb-1">Company</p>
          <p className="text-[15px] font-medium text-text-hi">{user.orgName ?? "—"}</p>
        </div>
        <div>
          <p className="eyebrow mb-1">Contact</p>
          <p className="text-[14px] text-text-mid">
            {user.displayName} · {user.email}
          </p>
        </div>
        <p className="glass-well px-4 py-3 text-[12.5px] leading-relaxed text-text-mid">
          To change company details, contact the Klipr team. Billing and
          escrow records reference them.
        </p>
      </GlassPanel>
    </div>
  );
}
