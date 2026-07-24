import Link from "next/link";
import { GlassPanel } from "@/components/app/glass-panel";
import { IconCheck, IconLink, IconWallet, IconMegaphone } from "@/components/icons";
import { cn } from "@/lib/cn";

type StepIcon = "link" | "wallet" | "megaphone";
const ICONS: Record<StepIcon, (p: { size?: number; strokeWidth?: number }) => React.ReactNode> = {
  link: IconLink,
  wallet: IconWallet,
  megaphone: IconMegaphone,
};

export interface SetupStep {
  title: string;
  subtitle: string;
  done: boolean;
  icon: StepIcon;
  actionLabel: string;
  href: string;
}

/**
 * New-clipper "Get set up to earn" checklist. Application-approved is the
 * always-done first step; the rest reflect real state (connected page,
 * bKash on file, first clip). Hidden entirely once every step is done.
 */
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const total = steps.length + 1; // +1 for the always-done "Application approved"
  const doneCount = 1 + steps.filter((s) => s.done).length;
  if (doneCount === total) return null;

  const pct = Math.round((doneCount / total) * 100);

  return (
    <GlassPanel className="p-5">
      {/* header with progress ring */}
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--ink-150)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="var(--success-500)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${pct} 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-bold text-ink-900 [font-variant-numeric:tabular-nums]">
            {doneCount}/{total}
          </span>
        </div>
        <div>
          <h2 className="text-[19px] font-extrabold tracking-[-0.01em] text-ink-900">
            Get set up to earn
          </h2>
          <p className="text-[13px] text-ink-500">
            {doneCount} of {total} done · takes a few minutes
          </p>
        </div>
      </div>

      {/* steps */}
      <div className="mt-4 flex flex-col gap-2.5">
        {/* application approved — always done */}
        <div className="flex items-center gap-3 rounded-[16px] bg-success-bg px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-success-500 text-white">
            <IconCheck size={20} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-ink-900">Application approved</p>
            <p className="text-[12.5px] text-ink-600">You&rsquo;re a vetted Clipper. Welcome in.</p>
          </div>
          <span className="text-[13.5px] font-bold text-success-600">Done</span>
        </div>

        {steps.map((step) => {
          const Icon = ICONS[step.icon];
          return (
            <div
              key={step.title}
              className={cn(
                "flex items-center gap-3 rounded-[16px] px-4 py-3.5",
                step.done ? "bg-success-bg" : "border border-[rgba(53,5,90,0.08)]",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
                  step.done ? "bg-success-500 text-white" : "bg-violet-100 text-violet-600",
                )}
              >
                {step.done ? <IconCheck size={20} strokeWidth={1.8} /> : <Icon size={19} strokeWidth={1.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-bold text-ink-900">{step.title}</p>
                <p className="text-[12.5px] text-ink-600">{step.subtitle}</p>
              </div>
              {step.done ? (
                <span className="text-[13.5px] font-bold text-success-600">Done</span>
              ) : (
                <Link
                  href={step.href}
                  className="shrink-0 rounded-full border border-violet-300 px-4 py-2 text-[13.5px] font-bold text-violet-700 transition-colors hover:bg-violet-50"
                >
                  {step.actionLabel}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
