import { BoltMark } from "@/components/ui/logo";
import { PixelDissolve } from "@/components/ui/pixel-dissolve";

/* Pre-launch honest marquee: value props + campaign niches — no fake clips,
 * no invented view counts. Pure statements of how Klipr works. */

const CLAIMS = [
  "Get paid per view",
  "No follower minimum",
  "Every view counts",
  "Verified views only",
  "Fast, easy payouts",
  "Post · Earn · Repeat",
];

const NICHES = [
  "Memes",
  "Sports",
  "Entertainment",
  "Food",
  "Music",
  "Tech",
  "Gaming",
  "Fashion",
  "News",
  "Motivation",
  "Education",
  "Your niche",
];

function ClaimsRow() {
  const doubled = [...CLAIMS, ...CLAIMS];
  return (
    <div className="marquee-row marquee-fade overflow-hidden">
      <div className="marquee-track marquee-l items-center">
        {doubled.map((claim, i) => (
          <span key={i} className="flex items-center gap-4 pr-2">
            <span
              className={`display whitespace-nowrap text-2xl font-bold uppercase tracking-tight md:text-3xl ${
                i % 2 ? "text-volt-500" : "text-text-hi"
              }`}
            >
              {claim}
            </span>
            <BoltMark className="h-5 shrink-0 text-volt-600" />
          </span>
        ))}
      </div>
    </div>
  );
}

function NichesRow() {
  const doubled = [...NICHES, ...NICHES];
  return (
    <div className="marquee-row marquee-fade overflow-hidden">
      <div className="marquee-track marquee-r items-center">
        {doubled.map((n, i) => (
          <span
            key={i}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium shadow-[0_6px_16px_-6px_rgba(53,5,90,0.45)] ${
              n === "Your niche"
                ? "bg-volt-500 text-white"
                : "bg-volt-600 text-ink-900"
            }`}
          >
            {n === "Your niche" ? (
              <span className="inline-flex items-center gap-1.5">
                <BoltMark className="h-3 text-yellow" />
                {n}
              </span>
            ) : (
              n
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ClipMarquee() {
  return (
    <section aria-hidden className="relative overflow-hidden bg-yellow pt-14 pb-24">
      <div className="flex flex-col gap-7">
        <ClaimsRow />
        <NichesRow />
      </div>
      {/* yellow crumbles into the amethyst how-it-works section */}
      <PixelDissolve color="var(--volt-600)" />
    </section>
  );
}
