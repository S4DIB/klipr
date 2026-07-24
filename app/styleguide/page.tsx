import { notFound } from "next/navigation";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatTile } from "@/components/app/stat-tile";
import { EmptyState } from "@/components/app/empty-state";
import { StatusChip } from "@/components/app/status-chip";
import { TierBadge } from "@/components/app/tier-badge";
import { XpBar } from "@/components/app/xp-bar";
import { DataRow } from "@/components/app/data-row";
import { TextField, SelectField } from "@/components/app/field";
import { TabBar } from "@/components/app/tab-bar";
import { Sparkline } from "@/components/ui/sparkline";
import { BudgetBar } from "@/components/ui/budget-bar";
import { Button, ArrowEast } from "@/components/ui/button";
import { BoltMark } from "@/components/ui/logo";
import * as Icons from "@/components/icons";

/**
 * Dev-only visual reference for the Klipr Glass system — every token,
 * recipe, and shared component on one page. 404s outside development.
 */
export default function StyleguidePage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const iconEntries = Object.entries(Icons).filter(
    ([name]) => name.startsWith("Icon"),
  ) as [string, (p: Icons.IconProps) => React.ReactNode][];

  const sampleSeries = [0, 180, 420, 890, 1400, 2600, 3100, 4800, 5200, 6900];

  return (
    <div className="relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />

      <main className="shell space-y-10 py-12 pb-32">
        <header>
          <p className="eyebrow">00 / Klipr Glass</p>
          <h1 className="display-1 mt-2 text-text-hi">Styleguide.</h1>
          <p className="mt-2 max-w-lg text-text-mid">
            Dev-only reference — tokens, glass recipes, and shared components.
          </p>
        </header>

        {/* Glass surfaces */}
        <section className="space-y-4">
          <p className="eyebrow">01 / Surfaces</p>
          <div className="grid gap-5 md:grid-cols-3">
            <GlassPanel className="p-6" interactive>
              <h3 className="title text-text-hi">.glass</h3>
              <p className="mt-1 text-[13.5px] text-text-mid">
                e1 card, hover lifts to e2.
              </p>
            </GlassPanel>
            <GlassPanel variant="e2" className="p-6">
              <h3 className="title text-text-hi">.glass-strong</h3>
              <p className="mt-1 text-[13.5px] text-text-mid">e2 chrome.</p>
            </GlassPanel>
            <GlassPanel variant="ink" className="relative overflow-hidden p-6">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 opacity-[0.08]"
                style={{
                  background: "url(/brand/pattern-01.svg) center/480px",
                }}
                aria-hidden="true"
              />
              <h3 className="title">.glass-ink</h3>
              <p className="mt-1 text-[13.5px] text-[rgba(255,255,244,0.7)]">
                One per screen. Pattern ≤ 8%.
              </p>
            </GlassPanel>
          </div>
        </section>

        {/* Typography + stats */}
        <section className="space-y-4">
          <p className="eyebrow">02 / Type &amp; numbers</p>
          <GlassPanel className="grid gap-8 p-7 md:grid-cols-3">
            <StatTile label="Wallet balance" value={0} prefix="৳" foot="No earnings yet — that's the truth." />
            <StatTile label="Verified views" value={128400} />
            <StatTile label="XP" value={860} foot={<TierBadge tier="beginner" size="sm" />} />
          </GlassPanel>
        </section>

        {/* Tiers + XP */}
        <section className="space-y-4">
          <p className="eyebrow">03 / Tiers &amp; XP</p>
          <GlassPanel className="p-7">
            <div className="flex flex-wrap items-center gap-3">
              <TierBadge tier="beginner" />
              <TierBadge tier="hustler" />
              <TierBadge tier="pro" />
              <TierBadge tier="elite" />
            </div>
            <XpBar className="mt-6 max-w-sm" xp={860} nextThreshold={1000} nextTierLabel="Hustler" />
          </GlassPanel>
        </section>

        {/* Status chips */}
        <section className="space-y-4">
          <p className="eyebrow">04 / Status chips</p>
          <GlassPanel className="flex flex-wrap gap-2.5 p-7">
            {[
              "pending", "tracking", "held", "settled", "rejected",
              "pending_funding", "active", "settling", "completed", "cancelled",
              "queued", "blocked_nid", "processing", "paid",
              "waitlisted", "approved", "declined", "simulated", "live",
            ].map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </GlassPanel>
        </section>

        {/* Icons */}
        <section className="space-y-4">
          <p className="eyebrow">05 / Functional icons ({iconEntries.length})</p>
          <GlassPanel className="p-7">
            <div className="grid grid-cols-3 gap-5 sm:grid-cols-5">
              {iconEntries.map(([name, Icon]) => (
                <div key={name} className="flex flex-col items-center gap-2 text-text-hi">
                  <div className="flex items-end gap-2.5">
                    <Icon size={16} />
                    <Icon size={20} />
                    <Icon size={24} />
                  </div>
                  <span className="font-mono text-[10px] text-text-low">{name}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>

        {/* Charts */}
        <section className="space-y-4">
          <p className="eyebrow">06 / Charts (hand-rolled)</p>
          <div className="grid gap-5 md:grid-cols-2">
            <GlassPanel className="p-7">
              <p className="eyebrow mb-3">View snapshots</p>
              <Sparkline points={sampleSeries} width={280} height={64} />
            </GlassPanel>
            <GlassPanel className="p-7">
              <p className="eyebrow mb-3">Budget</p>
              <BudgetBar spent={3800000} total={10000000} />
            </GlassPanel>
          </div>
        </section>

        {/* Rows + form */}
        <section className="space-y-4">
          <p className="eyebrow">07 / Rows &amp; fields</p>
          <div className="grid gap-5 md:grid-cols-2">
            <GlassPanel className="p-4">
              <DataRow
                leading={<Icons.IconCampaign size={18} />}
                primary="Demo campaign row"
                secondary="TikTok · ৳50 / 1,000 views"
                trailing={<StatusChip status="tracking" />}
                href="/styleguide"
              />
              <DataRow
                leading={<Icons.IconWallet size={18} />}
                primary="Settlement"
                secondary="Demo · settled clip"
                trailing={<span className="data-sm text-text-hi">+৳0</span>}
              />
            </GlassPanel>
            <GlassPanel className="space-y-4 p-7">
              <TextField label="Post URL" name="postUrl" placeholder="https://www.youtube.com/shorts/…" />
              <SelectField label="Niche" name="niche" defaultValue="memes">
                <option value="memes">Memes</option>
                <option value="sports">Sports</option>
              </SelectField>
              <div className="flex gap-3">
                <Button type="button">
                  Primary <ArrowEast />
                </Button>
                <Button type="button" variant="ghost">
                  Ghost
                </Button>
              </div>
            </GlassPanel>
          </div>
        </section>

        {/* Empty state + loader */}
        <section className="space-y-4">
          <p className="eyebrow">08 / Empty &amp; loading</p>
          <div className="grid gap-5 md:grid-cols-2">
            <GlassPanel>
              <EmptyState
                title="No live campaigns right now"
                line="New drops are announced here first."
                action={<Button type="button" variant="ghost">Notify me</Button>}
              />
            </GlassPanel>
            <GlassPanel className="flex items-center justify-center p-14">
              <BoltMark className="bolt-pulse h-8 w-auto text-volt-500" />
            </GlassPanel>
          </div>
        </section>
      </main>

      {/* Mobile tab bar demo */}
      <TabBar
        items={[
          { href: "/home", label: "Home", icon: "home" },
          { href: "/campaigns", label: "Drops", icon: "campaigns" },
          { href: "/styleguide", label: "Submit", icon: "upload", center: true },
          { href: "/wallet", label: "Wallet", icon: "wallet" },
          { href: "/settings", label: "Profile", icon: "profile" },
        ]}
      />
    </div>
  );
}
