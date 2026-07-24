import { cn } from "@/lib/cn";

/**
 * Status pill. Soft tinted fill + bold 11px sentence-case label, per the
 * Klipr Product design handoff. Covers every state machine in the V2.1
 * model (submissions, campaigns, payouts, applications, access,
 * connections) plus the verification-source chips.
 */
type Tone = "neutral" | "progress" | "success" | "attention" | "danger" | "simulated";

const TONES: Record<Tone, string> = {
  /* waiting / not-yet states */
  neutral: "bg-ink-150 text-ink-600",
  /* in-motion machine states (processing, queued jobs) */
  progress: "bg-violet-100 text-violet-700",
  /* terminal-good + live states */
  success: "bg-success-bg text-success-600",
  /* needs-a-human states */
  attention: "bg-warning-bg text-warning-600",
  /* terminal-bad states */
  danger: "bg-danger-bg text-danger-600",
  /* honesty chip. Simulated verification is always visibly labeled */
  simulated: "bg-warning-bg text-warning-600",
};

const STATUS_TONE: Record<string, Tone> = {
  // submissions
  pending: "neutral",
  tracking: "success",
  held: "attention",
  settled: "success",
  rejected: "danger",
  // campaigns
  draft: "neutral",
  pending_funding: "attention",
  active: "success",
  settling: "attention",
  completed: "success",
  cancelled: "danger",
  // payouts
  queued: "neutral",
  blocked_nid: "attention",
  processing: "progress",
  paid: "success",
  failed: "danger",
  // applications / access
  submitted: "neutral",
  waitlisted: "attention",
  approved: "success",
  declined: "danger",
  // connections / misc
  revoked: "danger",
  blocked: "danger",
  verified: "success",
  open: "attention",
  released: "success",
  upheld: "danger",
  // verification source
  live: "success",
  simulated: "simulated",
};

const LABELS: Record<string, string> = {
  pending_funding: "Pending funding",
  blocked_nid: "NID required",
  waitlisted: "Under review",
};

export function StatusChip({
  status,
  label,
  className,
}: {
  status: string;
  /** Override the rendered text (default: the status, prettified). */
  label?: string;
  className?: string;
}) {
  const tone = TONES[STATUS_TONE[status] ?? "neutral"];
  const raw = label ?? LABELS[status] ?? status.replace(/_/g, " ");
  const text = raw.charAt(0).toUpperCase() + raw.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] py-1 text-[11px] font-bold",
        tone,
        className,
      )}
    >
      {text}
    </span>
  );
}
