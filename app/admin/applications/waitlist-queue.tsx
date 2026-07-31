import { listLeads, type Lead } from "@/lib/leads";
import { EmptyState } from "@/components/app/empty-state";
import { StatusChip } from "@/components/app/status-chip";
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

/**
 * Landing-waitlist clippers awaiting manual vetting — reviewed here exactly
 * like in-app applications (they just don't have an account yet). Approving
 * pre-clears the email: their first sign-in lands straight in the app with
 * the reviewed pages marked vetted.
 */
export async function WaitlistQueue() {
  const leads = (await listLeads()).filter((l) => l.role === "clipper");
  const pending = leads
    .filter((l) => (l.status ?? "pending") === "pending")
    .sort((a, b) => a.at.localeCompare(b.at));
  const decided = leads
    .filter((l): l is Lead & { status: "approved" | "declined" } =>
      l.status === "approved" || l.status === "declined",
    )
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""))
    .slice(0, 6);

  return (
    <div className="flex w-full flex-col gap-8">
      <section>
        <p className="eyebrow">Waitlist · landing page</p>
        <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.01em] text-ink-900">
          Waitlist applications
        </h2>
        <p className="mt-0.5 text-[13px] leading-[1.55] text-ink-500">
          People who applied from the landing page, before creating an account. Open each page,
          check it against the Clipper Standard, then decide. Approved emails are pre-cleared —
          they land in the app the first time they sign in.
        </p>

        {pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No waitlist applications waiting"
              line="New landing-page signups appear here oldest-first."
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {pending.map((lead) => {
              const breach = hoursSince(lead.at) > SLA_HOURS;
              return (
                <div
                  key={lead.email}
                  className="rounded-[14px] border border-[rgba(53,5,90,0.08)] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-bold text-ink-900">
                        {lead.name ?? lead.email}
                      </p>
                      <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                        {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ""}
                        {lead.postFrequency ? ` · posts ${lead.postFrequency}` : ""}
                      </p>
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
                    <form
                      action={reviewWaitlistLead}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
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
            })}
          </div>
        )}
      </section>

      {decided.length > 0 ? (
        <section>
          <p className="eyebrow">Recently reviewed</p>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {decided.map((lead) => (
              <div
                key={lead.email}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-[rgba(53,5,90,0.06)] bg-white px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink-700">
                    {lead.name ?? lead.email}
                  </p>
                  {lead.status === "declined" && lead.declineReason ? (
                    <p className="truncate text-[11.5px] text-ink-400">{lead.declineReason}</p>
                  ) : null}
                </div>
                <StatusChip status={lead.status} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
