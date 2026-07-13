import { notFound } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth/session";
import { getCampaign, listSubmissions } from "@/lib/db";
import { taka, views as fmtViews, daysLeft } from "@/lib/format";
import { SubmitForm } from "@/components/app/submit-form";
import { StatusBadge } from "@/components/app/status-badge";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const user = (await currentUser())!;
  const mine = await listSubmissions({ campaignId: id, profileId: user.id });
  const verified = (await listSubmissions({ campaignId: id }))
    .filter((s) => s.status === "verified")
    .sort((a, b) => b.verifiedViews - a.verifiedViews)
    .slice(0, 5);

  const isAgency = user.role === "agency";
  const showForm = isAgency || mine.length === 0;

  return (
    <div>
      <Link href="/marketplace" className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-mid hover:text-text-hi">
        ← All campaigns
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        {/* main */}
        <div>
          <p className="text-sm text-text-low">{campaign.brand}</p>
          <h1 className="display mt-1 text-4xl text-text-hi">{campaign.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>{campaign.niche}</Pill>
            {campaign.allowedPlatforms.map((p) => (
              <Pill key={p}>{p}</Pill>
            ))}
          </div>

          <Section title="The brief">{campaign.brief}</Section>
          <Section title="Guidelines">{campaign.guidelines}</Section>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg text-text-hi">Source content</h2>
            <a
              href={campaign.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-volt-600 hover:border-volt-400"
            >
              ⬇ Download source clip
            </a>
          </div>

          {verified.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 font-display text-lg text-text-hi">Top clips</h2>
              <div className="overflow-hidden rounded-xl border border-line">
                {verified.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-text-low">{i + 1}</span>
                      <span className="text-sm text-text-hi">{s.postingHandle}</span>
                      <span className="text-xs text-text-low">{s.platform}</span>
                    </span>
                    <span className="font-mono text-sm font-semibold text-text-hi">
                      {fmtViews(s.verifiedViews)} views
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-shadow rounded-2xl border border-line bg-white p-6">
            <div className="grid grid-cols-2 gap-4 border-b border-line pb-5">
              <Meta label="Budget" value={taka(campaign.budget)} />
              <Meta label="Days left" value={String(daysLeft(campaign.endDate))} />
              <Meta label="Min views" value={fmtViews(campaign.minViewThreshold)} />
              <Meta label="Pays" value="per view" />
            </div>

            <div className="pt-5">
              {showForm ? (
                <>
                  <h2 className="mb-4 font-display text-lg text-text-hi">
                    Submit your clip
                  </h2>
                  <SubmitForm campaignId={campaign.id} platforms={campaign.allowedPlatforms} />
                </>
              ) : (
                <>
                  <h2 className="mb-3 font-display text-lg text-text-hi">
                    Your submission
                  </h2>
                  {mine.map((s) => (
                    <div key={s.id} className="rounded-xl border border-line p-4">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={s.status} />
                        <span className="font-mono text-sm font-semibold text-text-hi">
                          {fmtViews(s.verifiedViews)} views
                        </span>
                      </div>
                      <p className="mt-3 truncate text-xs text-text-low">{s.postUrl}</p>
                      {s.status === "rejected" && s.rejectReason && (
                        <p className="mt-2 text-xs text-red-600">{s.rejectReason}</p>
                      )}
                    </div>
                  ))}
                </>
              )}

              {isAgency && mine.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-text-low">
                    Your {mine.length} submissions
                  </p>
                  <div className="space-y-2">
                    {mine.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-text-mid">{s.postingHandle}</span>
                        <StatusBadge status={s.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-2 font-display text-lg text-text-hi">{title}</h2>
      <p className="max-w-[60ch] leading-relaxed text-text-mid">{children}</p>
    </div>
  );
}
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-ink-850 px-2.5 py-1 text-xs text-text-mid">
      {children}
    </span>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-lg font-semibold text-text-hi">{value}</p>
      <p className="text-xs text-text-low">{label}</p>
    </div>
  );
}
