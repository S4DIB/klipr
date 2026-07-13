import { cn } from "@/lib/cn";

export type ClipData = {
  grad: string; // tailwind gradient classes, e.g. "from-[#7d04d7] to-[#35055a]"
  Icon: React.ComponentType<{ className?: string }>;
  views: string;
  handle: string;
};

/** A vertical 9:14 video-clip thumbnail card. Decorative. */
export function ClipCard({
  clip,
  className,
}: {
  clip: ClipData;
  className?: string;
}) {
  const { grad, Icon, views, handle } = clip;
  return (
    <div
      className={cn(
        "relative h-[228px] w-[150px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br shadow-[0_18px_44px_-18px_rgba(16,24,40,0.45)] ring-1 ring-black/5",
        grad,
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
      <Icon className="absolute left-3 top-3 h-4 w-4 text-white/90" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/85 backdrop-blur-sm transition-transform">
          <svg width="13" height="15" viewBox="0 0 12 14" fill="#0a0c12" aria-hidden="true">
            <path d="M0 0l12 7-12 7V0Z" />
          </svg>
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-mono text-[13px] font-semibold text-white">{views}</p>
        <p className="truncate text-[11px] text-white/70">{handle}</p>
      </div>
    </div>
  );
}
