import { IconPlay } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Every campaign leads with a cover — the supplied clip's art. Until a brand
 * uploads real media we render an on-brand gradient placeholder so cards never
 * fall back to a blank rectangle. Gradient is deterministic per seed so a feed
 * of covers reads as varied, not repeated.
 */
const COVER_GRADIENTS = [
  "linear-gradient(140deg, #7d04d7 0%, #b3117d 100%)", // violet → magenta
  "linear-gradient(140deg, #35055a 0%, #7d04d7 100%)", // deep violet → violet
  "linear-gradient(140deg, #086b6b 0%, #0b7a5e 100%)", // teal → green
  "linear-gradient(140deg, #4a067d 0%, #9834e2 100%)", // plum → orchid
];

function gradientFor(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i);
  return COVER_GRADIENTS[n % COVER_GRADIENTS.length];
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i;

export function CampaignCover({
  coverUrl,
  seed,
  locked = false,
  rounded = "top",
  className,
}: {
  /** Real cover art (image or video). Absent ⇒ placeholder. */
  coverUrl?: string;
  /** Deterministic seed for the placeholder gradient (brand name works well). */
  seed: string;
  /** Muted, desaturated treatment for early-access locked cards. */
  locked?: boolean;
  /** Which corners to round to sit flush inside a card, or `all` when standalone. */
  rounded?: "top" | "all" | "none";
  className?: string;
}) {
  const isVideo = coverUrl ? VIDEO_EXT.test(coverUrl) : false;

  return (
    <div
      className={cn(
        "relative aspect-[16/9] overflow-hidden bg-ink-150",
        rounded === "top" && "rounded-t-[--radius-card]",
        rounded === "all" && "rounded-[--radius-card]",
        locked && "opacity-55 grayscale",
        className,
      )}
    >
      {coverUrl && isVideo ? (
        <video
          className="h-full w-full object-cover"
          src={coverUrl}
          muted
          playsInline
          loop
          preload="metadata"
        />
      ) : coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- decorative cover, not LCP-critical
        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundImage: gradientFor(seed) }}
        >
          {/* diagonal sheen for a little depth */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 46%)",
            }}
          />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
            <IconPlay size={20} strokeWidth={1.6} className="ml-0.5 text-white" />
          </span>
        </div>
      )}
    </div>
  );
}
