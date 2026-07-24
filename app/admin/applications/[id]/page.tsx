import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApplication, getProfile, listApplicationPages } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { Button } from "@/components/ui/button";
import {
  IconCheck,
  IconCheckCircle,
  IconLink,
  IconPlay,
  IconX,
} from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { hoursSince, dhakaDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { vetPage } from "../actions";
import { QueuePanel } from "../queue-panel";
import { DecideForm } from "./decide-form";

export const metadata: Metadata = { title: "Review application" };

const CHECKLIST = [
  { name: "activeRecently", label: "Active in the last 3 weeks" },
  { name: "postingCadence", label: "Posting 3-5× per week" },
  { name: "realEngagement", label: "Real engagement (not follower count)" },
] as const;

function appliedAgo(iso: string): string {
  const h = hoursSince(iso);
  return h < 24 ? `applied ${h}h ago` : `applied ${Math.floor(h / 24)}d ago`;
}

export default async function ReviewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();
  const [profile, pages] = await Promise.all([
    getProfile(application.profileId),
    listApplicationPages(id),
  ]);

  const open = application.status === "submitted";
  const approvedCount = pages.filter((p) => p.vetStatus === "approved").length;
  const name = profile?.displayName ?? application.profileId;
  const roleLabel = application.role === "agency" ? "Agency" : "Clipper";

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <QueuePanel selectedId={id} />

      <div className="min-w-0 flex-1">
        {!open ? (
          /* decided. The success / declined screen */
          <div className="sheet-rise flex min-h-[540px] flex-col items-center justify-center gap-3.5 text-center">
            {application.status === "approved" ? (
              <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-success-bg text-success-600">
                <IconCheckCircle size={44} strokeWidth={1.2} />
              </span>
            ) : (
              <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-danger-bg text-danger-600">
                <IconX size={38} strokeWidth={1.2} />
              </span>
            )}
            <div>
              <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">
                {application.status === "approved" ? "Access granted" : "Application declined"}
              </h1>
              <p className="mx-auto mt-1.5 max-w-[420px] text-[14px] leading-[1.55] text-ink-600">
                {application.status === "approved" ? (
                  <>
                    {name} is now <b>Active</b> at Beginner tier. Approved pages are connectable;
                    onboarding runs next. Decision saved to the audit trail.
                  </>
                ) : (
                  <>
                    Declined{" "}
                    {application.reviewedAt ? dhakaDateTime(application.reviewedAt) : ""}
                    {application.declineReason ? (
                      <>
                        {" "}
                       . Reason shown to the applicant: &ldquo;{application.declineReason}&rdquo;
                      </>
                    ) : null}
                  </>
                )}
              </p>
            </div>
            <Button
              href="/admin/applications"
              variant="secondary"
              className="h-11 px-6 text-[14px]"
            >
              Next in queue
            </Button>
          </div>
        ) : (
          <div className="flex max-w-[740px] flex-col gap-[18px]">
            {/* header */}
            <header>
              <p className="eyebrow text-violet-600">
                Application · {appliedAgo(application.createdAt)}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-volt-600 font-mono text-[16px] text-yellow">
                  {name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-[22px] font-extrabold tracking-[-0.02em] text-ink-900">
                    {name}
                  </h1>
                  <p className="text-[13px] text-ink-500">
                    {roleLabel} · {pages.length} declared page{pages.length === 1 ? "" : "s"} · vet
                    each individually
                    {profile?.email ? <> · {profile.email}</> : null}
                  </p>
                </div>
              </div>
            </header>

            {/* per-page review cards */}
            {pages.map((p, i) => (
              <GlassPanel key={p.id} className="p-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#111] text-white">
                      <IconPlay size={22} strokeWidth={1.3} />
                    </span>
                    <div className="min-w-0">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 truncate text-[16px] font-extrabold text-violet-600 hover:text-violet-800"
                      >
                        {p.handle}
                        <IconLink size={14} strokeWidth={1.4} className="shrink-0" />
                      </a>
                      <p className="text-[12px] text-ink-500">
                        {PLATFORMS[p.platform].label} ·{" "}
                        {p.selfReportedFollowers.toLocaleString("en-US")} followers · {p.niche}
                      </p>
                    </div>
                  </div>
                  {p.vetStatus === "approved" ? (
                    <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-[5px] text-[11px] font-bold text-success-600">
                      Approved
                    </span>
                  ) : p.vetStatus === "declined" ? (
                    <span className="shrink-0 rounded-full bg-danger-bg px-2.5 py-[5px] text-[11px] font-bold text-danger-600">
                      Declined
                    </span>
                  ) : null}
                </div>

                {/* applicant's note on the first card; reviewer note after */}
                {i === 0 && application.note ? (
                  <p className="mt-3 rounded-[10px] bg-[rgba(53,5,90,0.04)] px-3 py-2.5 text-[12.5px] leading-[1.55] text-ink-600">
                    &ldquo;{application.note}&rdquo;
                  </p>
                ) : null}
                {p.vetNote ? (
                  <p className="mt-3 rounded-[10px] bg-[rgba(53,5,90,0.04)] px-3 py-2.5 text-[12.5px] leading-[1.55] text-ink-600">
                    Reviewer note: {p.vetNote}
                  </p>
                ) : null}

                <p className="eyebrow mb-2.5 mt-4">Clipper Standard</p>
                {p.vetStatus === "pending" ? (
                  <form action={vetPage} className="flex flex-col gap-2">
                    <input type="hidden" name="pageId" value={p.id} />
                    {CHECKLIST.map((c) => (
                      <label
                        key={c.name}
                        className="flex cursor-pointer items-center gap-[11px] px-0.5 py-1"
                      >
                        <input type="checkbox" name={c.name} className="peer sr-only" />
                        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] border-ink-300 text-transparent transition-colors peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-violet-500">
                          <IconCheck size={15} strokeWidth={1.6} />
                        </span>
                        <span className="text-[13.5px] font-semibold text-ink-800">{c.label}</span>
                      </label>
                    ))}
                    <input
                      name="vetNote"
                      placeholder="Reviewer note (optional. Kept on file)"
                      className="focus-quiet glass-well mt-1 w-full px-3.5 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-400"
                    />
                    <div className="mt-2 flex gap-2.5">
                      <Button
                        type="submit"
                        name="decision"
                        value="approved"
                        className="h-[34px] px-4 text-[13px]"
                      >
                        Approve page
                      </Button>
                      <Button
                        type="submit"
                        name="decision"
                        value="declined"
                        variant="secondary"
                        className="h-[34px] px-4 text-[13px]"
                      >
                        Decline page
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2">
                    {CHECKLIST.map((c) => {
                      const on = p.vetChecklist?.[c.name] ?? false;
                      return (
                        <div key={c.name} className="flex items-center gap-[11px] px-0.5 py-1">
                          <span
                            className={cn(
                              "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px]",
                              on
                                ? "bg-violet-600 text-white"
                                : "border-[1.5px] border-ink-300 text-transparent",
                            )}
                          >
                            <IconCheck size={15} strokeWidth={1.6} />
                          </span>
                          <span className="text-[13.5px] font-semibold text-ink-800">
                            {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassPanel>
            ))}

            <DecideForm applicationId={application.id} approvedCount={approvedCount} />
            <p className="text-[11.5px] text-ink-400">
              Decisions are timestamped to the application audit trail.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
