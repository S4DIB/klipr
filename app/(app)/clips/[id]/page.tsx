import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import {
  getCampaign,
  getConnectedAccount,
  getSubmission,
  listFraudFlags,
  listSnapshots,
} from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { Sparkline } from "@/components/ui/sparkline";
import { IconChevronLeft } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { takaFromPoisha, dhakaDate, dhakaDateTime } from "@/lib/format";
import { clipperEarningsPoisha } from "@/lib/money";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Clip" };

function windowLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "window ended";
  const d = Math.floor(ms / 86400_000);
  const h = Math.floor((ms % 86400_000) / 3600_000);
  return d > 0 ? `${d}d ${h}h left in window` : `${h}h left in window`;
}

export default async function ClipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireActiveClipper();
  const { id } = await params;
  const sub = await getSubmission(id);
  if (!sub || sub.profileId !== user.id) notFound();

  const [campaign, account, snapshots, flags] = await Promise.all([
    getCampaign(sub.campaignId),
    getConnectedAccount(sub.connectedAccountId),
    listSnapshots(sub.id),
    listFraudFlags({ submissionId: sub.id }),
  ]);

  const counted = snapshots.map((s) => Math.max(0, s.views - sub.baselineViews));
  const simulated = snapshots.some((s) => s.source === "simulated");
  const settled = sub.status === "settled";
  const dayNow = Math.max(
    0,
    Math.floor(
      ((settled && sub.settledAt ? new Date(sub.settledAt) : new Date()).getTime() -
        new Date(sub.submittedAt).getTime()) /
        86400_000,
    ),
  );

  const rate = campaign?.rateClipperPer1k ?? 5000;
  const minViews = campaign?.minQualifyViews ?? 2000;
  const displayViews = settled ? (sub.lockedViews ?? 0) : sub.countedViews;
  const estPoisha = settled
    ? (sub.earnedPoisha ?? 0)
    : displayViews >= minViews
      ? clipperEarningsPoisha(displayViews, rate)
      : 0;

  const steps: { label: string; note: string; state: "done" | "active" | "todo" }[] = [
    {
      label: "Submitted",
      note: `${dhakaDate(sub.submittedAt)} · post URL accepted`,
      state: "done",
    },
    {
      label: "Baseline captured",
      note: "Starting views recorded automatically",
      state: sub.status === "pending" ? "active" : "done",
    },
    {
      label: sub.status === "held" ? "On hold" : "Tracking",
      note:
        sub.status === "held"
          ? (sub.holdReason ?? "An automatic check flagged this clip. A reviewer will clear it.")
          : simulated
            ? "Simulated polling until this platform's API approval lands"
            : "Polling the platform API every 15 min",
      state:
        sub.status === "tracking" || sub.status === "held"
          ? "active"
          : sub.status === "pending"
            ? "todo"
            : "done",
    },
    sub.status === "rejected"
      ? {
          label: "Rejected",
          note: sub.rejectReason ?? "This clip did not pass review",
          state: "done",
        }
      : {
          label: settled ? `Settled ${dhakaDate(sub.settledAt ?? sub.windowEndsAt)}` : `Settles ${dhakaDate(sub.windowEndsAt)}`,
          note: "Views lock · earnings pay to your wallet",
          state: settled ? "done" : "todo",
        },
  ];

  return (
    <div className="mx-auto w-full max-w-[480px] lg:max-w-none">
      <Link
        href="/clips"
        className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-600 transition-colors hover:text-ink-900"
      >
        <IconChevronLeft size={16} strokeWidth={1.4} /> Clips
      </Link>

      <div className="mt-[14px] flex flex-col gap-[14px] lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-5">
        <div className="flex min-w-0 flex-col gap-[14px]">
      <header>
        <h1 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink-900">
          {campaign ? `${campaign.brandName} · ${campaign.name}` : "Clip"}
        </h1>
        <p className="text-[12px] text-ink-500">
          {PLATFORMS[sub.platform].surface}
          {account ? <> · {account.handle}</> : null} ·{" "}
          <a href={sub.postUrl} target="_blank" rel="noopener noreferrer">
            open post ↗
          </a>
        </p>
      </header>

      {/* verified views */}
      <GlassPanel className="p-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Verified views</span>
          {sub.status === "tracking" && !simulated ? (
            <span className="rounded-full bg-success-bg px-[9px] py-1 text-[11px] font-bold text-success-600">
              ● Tracking · live
            </span>
          ) : sub.status === "tracking" && simulated ? (
            <span className="rounded-full bg-warning-bg px-[9px] py-1 text-[11px] font-bold text-warning-600">
              ● Tracking · simulated
            </span>
          ) : (
            <StatusChip status={sub.status} />
          )}
        </div>
        <p className="mt-1.5 font-mono text-[40px] font-semibold tracking-[-0.02em] text-ink-900 [font-variant-numeric:tabular-nums]">
          {displayViews.toLocaleString("en-US")}
        </p>
        <p className="text-[12px] text-ink-500">
          Counts from submission onward
          {settled ? " · views locked" : ` · ${windowLeft(sub.windowEndsAt)}`}
        </p>
        {counted.length >= 2 ? (
          <>
            <div className="mt-3">
              <Sparkline
                points={counted}
                width={320}
                height={92}
                stroke="var(--violet-600)"
                className="block h-[92px] w-full"
              />
            </div>
            <div className="flex justify-between text-[10.5px] text-ink-400">
              <span>Day 0</span>
              <span>{settled ? `Day ${dayNow}` : `Now · day ${dayNow}`}</span>
            </div>
          </>
        ) : (
          <p className="glass-well mt-3 px-3 py-2.5 text-[12px] text-ink-500">
            The view curve appears after the first tracking snapshots land.
          </p>
        )}
      </GlassPanel>

      {/* est. earnings */}
      <GlassPanel className="flex items-center justify-between p-4">
        <div>
          <span className="eyebrow">{settled ? "Earned" : "Est. earnings so far"}</span>
          <p className="mt-1 font-mono text-[24px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {takaFromPoisha(estPoisha)}
          </p>
          {sub.xpAwarded ? (
            <p className="text-[11px] text-ink-500">+{sub.xpAwarded} XP awarded</p>
          ) : null}
        </div>
        <p className="max-w-[160px] text-right text-[11px] leading-[1.5] text-ink-500">
          {settled
            ? estPoisha === 0
              ? `Below the ${minViews.toLocaleString("en-US")}-view minimum, or the budget was already spent. Shown honestly, never silently.`
              : `${(sub.lockedViews ?? 0).toLocaleString("en-US")} locked views × ${takaFromPoisha(rate)}/1,000.`
            : displayViews < minViews
              ? `Qualifies at ${minViews.toLocaleString("en-US")} views. Below that a clip settles at ৳0.`
              : "Settles at window end, clamped to remaining budget."}
        </p>
      </GlassPanel>
        </div>

        <div className="flex flex-col gap-[14px]">
      {/* status timeline */}
      <GlassPanel className="p-4">
        <span className="eyebrow">Status timeline</span>
        <ol className="mt-3 flex flex-col">
          {steps.map((step, i) => (
            <li key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "h-[11px] w-[11px] shrink-0 rounded-full",
                    step.state === "done" && "bg-success-500",
                    step.state === "active" && "bg-violet-600 shadow-[0_0_0_4px_var(--violet-100)]",
                    step.state === "todo" && "bg-ink-200",
                  )}
                  aria-hidden="true"
                />
                {i < steps.length - 1 ? <span className="w-[2px] flex-1 bg-ink-200" /> : null}
              </div>
              <div className={cn(i < steps.length - 1 && "pb-3.5", "-mt-px")}>
                <p
                  className={cn(
                    "text-[13px] font-bold",
                    step.state === "active"
                      ? "text-violet-700"
                      : step.state === "todo"
                        ? "text-ink-400"
                        : "text-ink-900",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-ink-500">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </GlassPanel>

      {flags.length > 0 && (
        <GlassPanel variant="well" className="p-4">
          <span className="eyebrow">Checks</span>
          <div className="mt-2 flex flex-col gap-1.5">
            {flags.map((f) => (
              <p key={f.id} className="flex items-center gap-2 text-[12.5px] text-ink-600">
                {f.rule.replace(/_/g, " ")} <StatusChip status={f.status} />
              </p>
            ))}
          </div>
        </GlassPanel>
      )}

      <p className="text-center text-[11px] text-ink-400">
        Last snapshot: {snapshots.length > 0 ? dhakaDateTime(snapshots[snapshots.length - 1].capturedAt) : "none yet"}
      </p>
        </div>
      </div>
    </div>
  );
}
