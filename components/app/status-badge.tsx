const STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  verified: "bg-ok/10 text-ok",
  approved: "bg-ok/10 text-ok",
  rejected: "bg-red-50 text-red-600",
  paid: "bg-ok/10 text-ok",
  active: "bg-volt-500/10 text-volt-600",
  closed: "bg-ink-800 text-text-mid",
  draft: "bg-ink-800 text-text-mid",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[status] ?? "bg-ink-850 text-text-mid"
      }`}
    >
      {status}
    </span>
  );
}
