import Link from "next/link";
import { listApplications, getProfile, listApplicationPages } from "@/lib/db";
import { StatusChip } from "@/components/app/status-chip";
import { PLATFORMS } from "@/lib/platforms";
import { hoursSince } from "@/lib/format";
import { cn } from "@/lib/cn";

const SLA_HOURS = 48;

/** Age label: "6h" under a day, then "2d". */
function age(iso: string): string {
  const h = hoursSince(iso);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

/**
 * The left rail of the vetting console: submitted applications oldest-first,
 * SLA breaches in red, recently decided below. Server component. Selection
 * is just the current route.
 */
export async function QueuePanel({ selectedId }: { selectedId?: string }) {
  const queue = (await listApplications("submitted")).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const decided = (await listApplications())
    .filter((a) => a.status !== "submitted")
    .slice(-6)
    .reverse();

  const enriched = await Promise.all(
    queue.map(async (a) => ({
      application: a,
      profile: await getProfile(a.profileId),
      pages: await listApplicationPages(a.id),
    })),
  );

  return (
    <aside className="glass-strong h-fit w-full shrink-0 rounded-[--radius-card] p-3.5 lg:w-[288px]">
      <p className="eyebrow px-1.5 pb-2 pt-1">Vetting queue · oldest first</p>
      {enriched.length === 0 ? (
        <p className="px-1.5 pb-2 text-[12.5px] leading-relaxed text-ink-500">
          Nothing needs you. Every application has been reviewed.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {enriched.map(({ application, profile, pages }) => {
            const selected = application.id === selectedId;
            const breach = hoursSince(application.createdAt) > SLA_HOURS;
            return (
              <Link
                key={application.id}
                href={`/admin/applications/${application.id}`}
                className={cn(
                  "block rounded-[14px] p-3 transition-colors",
                  selected
                    ? "border-[1.5px] border-violet-300 bg-white shadow-[var(--shadow-sm)]"
                    : "bg-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.75)]",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-[13.5px] font-bold",
                      selected ? "text-ink-900" : "text-ink-700",
                    )}
                  >
                    {profile?.displayName ?? application.profileId}
                  </span>
                  {breach ? (
                    <span className="shrink-0 rounded-full bg-danger-bg px-[7px] py-[3px] text-[10px] font-bold text-danger-600">
                      SLA {age(application.createdAt)}
                    </span>
                  ) : (
                    <span className="shrink-0 font-mono text-[11px] text-ink-400">
                      {age(application.createdAt)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-ink-500">
                  {application.role === "agency" ? "Agency" : "Clipper"} · {pages.length} page
                  {pages.length === 1 ? "" : "s"} ·{" "}
                  {[...new Set(pages.map((p) => PLATFORMS[p.platform].label))].join(", ")}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <p className="eyebrow px-1.5 pb-2 pt-4">Decided</p>
          <div className="flex flex-col gap-1.5">
            {decided.map((a) => (
              <Link
                key={a.id}
                href={`/admin/applications/${a.id}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-[14px] p-3 transition-colors",
                  a.id === selectedId
                    ? "border-[1.5px] border-violet-300 bg-white shadow-[var(--shadow-sm)]"
                    : "bg-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.6)]",
                )}
              >
                <DecidedName profileId={a.profileId} />
                <StatusChip status={a.status} />
              </Link>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

async function DecidedName({ profileId }: { profileId: string }) {
  const profile = await getProfile(profileId);
  return (
    <span className="truncate text-[13px] font-semibold text-ink-600">
      {profile?.displayName ?? profileId}
    </span>
  );
}
