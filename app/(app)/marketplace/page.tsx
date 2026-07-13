import Link from "next/link";
import type { Metadata } from "next";
import { listCampaigns, listSubmissions } from "@/lib/db";
import { taka, daysLeft, views as fmtViews } from "@/lib/format";

export const metadata: Metadata = { title: "Campaigns" };

const GRADIENTS: Record<string, string> = {
  Fashion: "from-[#7d04d7] to-[#35055a]",
  Music: "from-[#9a2ee8] to-[#35055a]",
  News: "from-[#14f9c5] to-[#7d04d7]",
  Tech: "from-[#ff7bc0] to-[#7d04d7]",
};

export default async function MarketplacePage() {
  const campaigns = await listCampaigns("active");
  const allSubs = await listSubmissions();
  const viewsByCampaign = new Map<string, number>();
  for (const s of allSubs) {
    if (s.status === "verified") {
      viewsByCampaign.set(
        s.campaignId,
        (viewsByCampaign.get(s.campaignId) ?? 0) + s.verifiedViews,
      );
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="display text-3xl text-text-hi">Live campaigns</h1>
        <p className="mt-2 text-text-mid">
          Pick a campaign, post the clip, get paid per verified view.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => {
          const totalViews = viewsByCampaign.get(c.id) ?? 0;
          return (
            <Link
              key={c.id}
              href={`/campaign/${c.id}`}
              className="card-shadow group block overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-volt-400/50 hover:shadow-[0_28px_60px_-20px_rgba(125,4,215,0.3)]"
            >
              <div className={`relative h-24 bg-gradient-to-br ${GRADIENTS[c.niche] ?? "from-[#ff7bc0] to-[#35055a]"}`}>
                <span className="absolute bottom-3 left-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-text-hi">
                  {c.niche}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-text-low">{c.brand}</p>
                <h3 className="mt-0.5 font-display text-lg text-text-hi">{c.name}</h3>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                  <Stat label="Budget" value={taka(c.budget)} />
                  <Stat label="Views" value={fmtViews(totalViews)} />
                  <Stat label="Days left" value={String(daysLeft(c.endDate))} />
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.allowedPlatforms.map((p) => (
                    <span key={p} className="rounded-md bg-ink-850 px-2 py-0.5 text-[11px] text-text-mid">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-sm font-semibold text-text-hi">{value}</p>
      <p className="text-[11px] text-text-low">{label}</p>
    </div>
  );
}
