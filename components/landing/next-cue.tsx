const TONES = {
  dark: "text-white/55 hover:text-yellow",
  yellow: "text-volt-600/60 hover:text-volt-500",
} as const;

/** Funnel connective tissue — every chapter ends by pointing at the next one,
 *  so there is always exactly one obvious thing to do: keep going. */
export function NextCue({
  href,
  label,
  variant = "dark",
}: {
  href: string;
  label: string;
  variant?: keyof typeof TONES;
}) {
  return (
    <div className="mt-16 flex justify-center">
      <a
        href={href}
        className={`group flex flex-col items-center gap-2 transition-colors ${TONES[variant]}`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.24em]">
          {label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="cue-bounce"
        >
          <path d="M3 6l5 5 5-5" />
        </svg>
      </a>
    </div>
  );
}
