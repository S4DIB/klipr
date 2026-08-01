import { listLeads, type Lead } from "@/lib/leads";
import { EmptyState } from "@/components/app/empty-state";
import { StatusChip } from "@/components/app/status-chip";
import { FilterTabs, type FilterKey } from "@/components/app/filter-tabs";
import { PLATFORMS, platformFromUrl, handleFromUrl } from "@/lib/platforms";
import { hoursSince, dhakaDateTime } from "@/lib/format";
import { reviewWaitlistLead } from "./actions";

const SLA_HOURS = 48;

function age(iso: string): string {
  const h = hoursSince(iso);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

/** Early leads may carry a legacy page shape ({platform, handle}) with no link. */
type RawLeadPage = { link?: unknown; niche?: unknown; platform?: unknown; handle?: unknown };

function PageChip({ page }: { page: RawLeadPage }) {
  const link = typeof page.link === "string" ? page.link : undefined;
  const platform = link ? platformFromUrl(link) : null;
  const label = platform
    ? PLATFORMS[platform].label
    : typeof page.platform === "string"
      ? page.platform
      : "Link";
  const text = link
    ? handleFromUrl(link)
    : typeof page.handle === "string"
      ? page.handle
      : "—";
  const niche = typeof page.niche === "string" ? page.niche : undefined;

  const body = (
    <>
      <span className="shrink-0 capitalize">{label}</span>
      <span className="truncate font-normal text-ink-600">{text}</span>
      {niche ? (
        <span className="shrink-0 text-[11px] font-normal text-ink-400">· {niche}</span>
      ) : null}
    </>
  );
  const className =
    "glass-well inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-violet-700";

  return link ? (
    <a
      href={link.startsWith("http") ? link : `https://${link}`}
      target="_blank"
      rel="noreferrer"
      className={`${className} transition-colors hover:bg-[rgba(53,5,90,0.08)]`}
    >
      {body}
    </a>
  ) : (
    <span className={className}>{body}</span>
  );
}

function RoleBadge({ role }: { role: Lead["role"] }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${
        role === "brand"
          ? "bg-[rgba(125,4,215,0.1)] text-violet-700"
          : "bg-[rgba(53,5,90,0.06)] text-ink-500"
      }`}
    >
      {role}
    </span>
  );
}

function LeadMeta({ lead }: { lead: Lead }) {
  return (
    <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
      {lead.email}
      {lead.phone ? ` · ${lead.phone}` : ""}
      {lead.role === "brand"
        ? [lead.company, lead.designation].filter(Boolean).map((s) => ` · ${s}`).join("")
        : lead.postFrequency
          ? ` · posts ${lead.postFrequency}`
          : ""}
    </p>
  );
}

/**
 * Landing-waitlist applications — clippers and brands awaiting manual vetting.
 * Filtered into Pending / Approved / Rejected. Approving pre-clears the email:
 * the first sign-in lands straight in the app (clipper onboarding or brand).
 */
export async function WaitlistQueue({ status = "pending" }: { status?: FilterKey }) {
  const leads = (await listLeads()).filter((l) => l.role === "clipper" || l.role === "brand");

  const pending = leads
    .filter((l) => (l.status ?? "pending") === "pending")
    .sort((a, b) => a.at.localeCompare(b.at));
  const approved = leads
    .filter((l) => l.status === "approved")
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));
  const rejected = leads
    .filter((l) => l.status === "declined")
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));

  const counts = { pending: pending.length, approved: approved.length, rejected: rejected.length };
  const list = status === "approved" ? approved : status === "rejected" ? rejected : pending;

  return (
    <div className="flex w-full flex-col gap-5">
      <FilterTabs basePath="/admin/applications" current={status} counts={counts} />

      {list.length === 0 ? (
        <EmptyState
          title={`No ${status} applications`}
          line={
            status === "pending"
              ? "New landing-page signups appear here oldest-first."
              : `Applications you’ve ${status === "approved" ? "approved" : "rejected"} show up here.`
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((lead) =>
            status === "pending" ? (
              <PendingCard key={lead.email} lead={lead} />
            ) : (
              <DecidedCard key={lead.email} lead={lead} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function PendingCard({ lead }: { lead: Lead }) {
  const breach = hoursSince(lead.at) > SLA_HOURS;
  return (
    <div className="rounded-[14px] border border-[rgba(53,5,90,0.08)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[14.5px] font-bold text-ink-900">
            <span className="truncate">{lead.name ?? lead.email}</span>
            <RoleBadge role={lead.role} />
          </p>
          <LeadMeta lead={lead} />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {breach ? (
            <span className="rounded-full bg-danger-bg px-[7px] py-[3px] text-[10px] font-bold text-danger-600">
              SLA {age(lead.at)}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-ink-400">{age(lead.at)}</span>
          )}
          <span className="whitespace-nowrap font-mono text-[11px] text-ink-400">
            {dhakaDateTime(lead.at)}
          </span>
        </div>
      </div>

      {lead.pages && lead.pages.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lead.pages.map((p, i) => (
            <PageChip key={`${lead.email}-${i}`} page={p} />
          ))}
        </div>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <form action={reviewWaitlistLead}>
          <input type="hidden" name="email" value={lead.email} />
          <button
            type="submit"
            name="decision"
            value="approved"
            className="rounded-full bg-volt-600 px-4.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-volt-500"
          >
            Approve
          </button>
        </form>
        <form action={reviewWaitlistLead} className="flex min-w-0 flex-1 items-center gap-2">
          <input type="hidden" name="email" value={lead.email} />
          <input
            name="reason"
            required
            minLength={5}
            placeholder="Decline reason (kept on record)"
            className="focus-quiet glass-well min-w-0 flex-1 rounded-full px-3.5 py-2 text-[13px] text-ink-900 placeholder:text-ink-400"
          />
          <button
            type="submit"
            name="decision"
            value="declined"
            className="shrink-0 rounded-full border border-[rgba(53,5,90,0.14)] px-4 py-2 text-[13px] font-bold text-danger-600 transition-colors hover:bg-danger-bg"
          >
            Decline
          </button>
        </form>
      </div>
    </div>
  );
}

function DecidedCard({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-[14px] border border-[rgba(53,5,90,0.08)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[14px] font-bold text-ink-900">
            <span className="truncate">{lead.name ?? lead.email}</span>
            <RoleBadge role={lead.role} />
          </p>
          <LeadMeta lead={lead} />
          {lead.status === "declined" && lead.declineReason ? (
            <p className="mt-1 truncate text-[11.5px] text-ink-400">
              Reason: {lead.declineReason}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusChip status={lead.status === "declined" ? "declined" : "approved"} />
          {lead.reviewedAt ? (
            <span className="whitespace-nowrap font-mono text-[11px] text-ink-400">
              {dhakaDateTime(lead.reviewedAt)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
