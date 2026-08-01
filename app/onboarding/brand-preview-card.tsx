import { IconLink } from "@/components/icons";

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="2.5" width="7" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 6.5h2.5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H10M5.2 5h2.6M5.2 7.5h2.6M5.2 10h2.6"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 14s5-4.2 5-8A5 5 0 0 0 3 6c0 3.8 5 8 5 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/**
 * Live business-identity preview for the brand onboarding — the white inset on
 * the violet card (mirrors the clipper PreviewCard). Grows as the brand fills
 * in: logo + business name + website, then industry/country chips, then the
 * contact person on the final step.
 */
export function BrandPreviewCard({
  businessName,
  website,
  industry,
  country,
  avatarUrl,
  personName,
  email,
  showContact,
}: {
  businessName?: string;
  website?: string;
  industry?: string;
  country?: string;
  avatarUrl?: string;
  personName?: string;
  email?: string;
  showContact?: boolean;
}) {
  const initial = (businessName || "B").trim().charAt(0).toUpperCase();
  const chips = [
    industry ? { icon: <BuildingIcon />, text: industry } : null,
    country ? { icon: <PinIcon />, text: country } : null,
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <div className="rounded-[18px] bg-white p-5 shadow-[0_10px_30px_-12px_rgba(20,0,40,0.5)]">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(125,4,215,0.1)] font-mono text-[22px] font-bold text-violet-700">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[19px] font-extrabold tracking-[-0.01em] text-[#1c0a2e]">
            {businessName?.trim() || "Your business"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13.5px] text-ink-500">
            <IconLink size={13} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{website?.trim() || "yourcompany.com"}</span>
          </p>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#7d04d7] px-3 py-1.5 text-[12.5px] font-semibold text-white"
            >
              <span className="text-white/80">{c.icon}</span>
              {c.text}
            </span>
          ))}
        </div>
      )}

      {showContact && (
        <>
          <div className="my-4 h-px bg-[rgba(53,5,90,0.08)]" />
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-volt-600 font-mono text-[15px] text-yellow">
                {(personName || "Y").trim().charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-[#1c0a2e]">
                {personName?.trim() || "Your name"}
              </p>
              <p className="truncate text-[13px] text-ink-500">{email}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
