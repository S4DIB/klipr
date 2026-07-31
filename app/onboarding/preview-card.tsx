function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 14s5-4.2 5-8A5 5 0 0 0 3 6c0 3.8 5 8 5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.6 8h10.8M8 2.6c1.6 1.6 1.6 9.2 0 10.8M8 2.6c-1.6 1.6-1.6 9.2 0 10.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The live identity preview that sits beside every onboarding step — mirrors
 * what the clipper is filling in (avatar · name · @username, then location and
 * languages as they add them). Plain presentational component: safe in both the
 * client step forms (live, as-you-type) and the server-rendered steps.
 */
export function PreviewCard({
  avatarUrl,
  name,
  username,
  location,
  languages,
}: {
  avatarUrl?: string;
  name?: string;
  username?: string;
  location?: string;
  languages?: string[];
}) {
  const initial = (name || "K").trim().charAt(0).toUpperCase();
  const chips = [
    location ? { icon: <PinIcon />, text: location } : null,
    languages && languages.length ? { icon: <GlobeIcon />, text: languages.join(", ") } : null,
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <div className="rounded-[18px] bg-white p-5 shadow-[0_10px_30px_-12px_rgba(20,0,40,0.5)]">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-[rgba(53,5,90,0.1)]"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-volt-600 font-mono text-[22px] text-yellow">
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[19px] font-extrabold tracking-[-0.01em] text-[#1c0a2e]">
            {name?.trim() || "Your name"}
          </p>
          <p className="truncate text-[14px] text-ink-500">
            @{username?.trim() || "username"}
          </p>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#7d04d7] px-3 py-1.5 text-[12.5px] font-semibold text-white"
            >
              <span className="text-white">{c.icon}</span>
              {c.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
