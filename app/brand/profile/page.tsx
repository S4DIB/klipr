import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { listCampaignsByBrand, listSubmissionsForCampaigns } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { CoverControls } from "@/components/app/cover-controls";
import { CompanyPanel } from "@/app/brand/settings/company-form";
import { Button } from "@/components/ui/button";
import { takaFromPoisha, views as fmtViews } from "@/lib/format";

export const metadata: Metadata = { title: "Brand profile" };

export default async function BrandProfilePage() {
  const user = await requireRole("brand");

  const campaigns = await listCampaignsByBrand(user.id);
  const subs = await listSubmissionsForCampaigns(campaigns.map((c) => c.id));

  // reach counts settled clips at their locked views and live ones at what
  // they've counted so far — the same rule the brand overview uses
  const reach = subs.reduce(
    (a, s) =>
      a +
      (s.status === "settled"
        ? (s.lockedViews ?? 0)
        : s.status === "tracking" || s.status === "held"
          ? s.countedViews
          : 0),
    0,
  );
  const live = campaigns.filter((c) => c.status === "active" || c.status === "settling").length;
  const spent = campaigns.reduce((a, c) => a + c.spentPoisha, 0);

  const orgName = user.orgName || user.displayName;
  const initial = (orgName || "K").trim().charAt(0).toUpperCase();
  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    year: "numeric",
  });
  // the stored website may or may not carry a scheme; link needs one, label doesn't
  const siteHref = user.website
    ? user.website.startsWith("http")
      ? user.website
      : `https://${user.website}`
    : undefined;
  const siteLabel = user.website?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const stats = [
    { label: "Campaigns", value: String(campaigns.length) },
    { label: "Live", value: String(live) },
    { label: "Clips", value: String(subs.length) },
    { label: "Views delivered", value: fmtViews(reach) },
    { label: "Spent", value: takaFromPoisha(spent) },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 sm:max-w-none">
      {/* brand header — cover · logo · name · stats */}
      <GlassPanel className="overflow-hidden">
        <div className="field-cover relative h-[112px] sm:h-[148px]">
          <CoverControls coverUrl={user.coverUrl} />
        </div>

        <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
          {/* logo — squared off, unlike the clipper's round avatar */}
          <span className="absolute -top-[44px] left-5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[24px] bg-volt-600 font-mono text-[32px] text-yellow shadow-[0_12px_28px_-10px_rgba(31,3,53,0.35)] ring-4 ring-white sm:-top-[52px] sm:left-7 sm:h-[104px] sm:w-[104px] sm:text-[38px]">
            {user.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>

          {/* spacer row beside the logo — the quiet action lives here */}
          <div className="flex min-h-[44px] items-start justify-end sm:min-h-[52px]">
            <Button
              href="/brand/settings"
              variant="ghost"
              className="mt-2.5 h-9 px-4 text-[13px] sm:mt-3 sm:h-10 sm:px-5 sm:text-[13.5px]"
            >
              Account settings
            </Button>
          </div>

          <h1 className="mt-2 text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink-900 sm:text-[26px]">
            {orgName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-ink-500">
            {user.industry ? (
              <span className="rounded-full bg-[rgba(53,5,90,0.06)] px-2.5 py-1 text-[11.5px] font-bold text-ink-700">
                {user.industry}
              </span>
            ) : null}
            {siteHref ? (
              <a
                href={siteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-violet-600 transition-colors hover:text-violet-700"
              >
                {siteLabel}
              </a>
            ) : null}
            {user.location ? <span>{user.location}</span> : null}
            <span>Joined {joined}</span>
          </div>

          {/* stats strip */}
          <div className="mt-5 grid grid-cols-3 gap-y-4 border-t border-[rgba(53,5,90,0.07)] pt-4 sm:grid-cols-5">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={
                  "px-2 text-center sm:border-l sm:border-[rgba(53,5,90,0.07)]" +
                  (i === 0 ? " sm:border-l-0" : "")
                }
              >
                <p className="font-mono text-[17px] font-bold tracking-[-0.02em] text-ink-900 [font-variant-numeric:tabular-nums] sm:text-[19px] xl:text-[21px]">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* the only settings that live here: who the brand is. Contact details and
          closing the account stay on /brand/settings. */}
      <div className="rounded-[22px] bg-white p-6 shadow-[0_1px_2px_rgba(31,3,53,0.04)] sm:p-7">
        <CompanyPanel
          brand={{
            orgName: user.orgName ?? "",
            website: user.website,
            industry: user.industry,
            location: user.location,
            monthlySpend: user.monthlySpend,
            logoUrl: user.logoUrl,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          }}
        />
      </div>
    </div>
  );
}
