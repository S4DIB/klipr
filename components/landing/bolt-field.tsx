/* Scattered brand bolts (Pattern 02) — the yellow 3D bolt sprinkled across the
 * whole page at varied size, rotation and depth, gently bobbing. Decorative and
 * behind the content. Placements are hand-authored (not Math.random) so SSR and
 * client match, and so bolts stay clear of the body copy. `top` is a % of full
 * page height; each bolt hugs a side (or drifts toward the middle at low
 * opacity). Rotation lives on the wrapper so the bob translate composes with it. */

type Bolt = {
  top: string;
  left?: string;
  right?: string;
  h: number; // px height (the tall dimension)
  rot: number; // degrees
  op: number;
  dur: number; // bob seconds
  delay: number;
};

const BOLTS: Bolt[] = [
  // hero
  { top: "2.5%", left: "3%", h: 36, rot: -18, op: 1, dur: 7, delay: 0 },
  { top: "5%", right: "5%", h: 24, rot: 20, op: 0.9, dur: 8, delay: -1 },
  // the big hero bolt — sits in the open gap between the headline and the
  // phone, ABOVE the subheadline so it never lands on the body copy
  { top: "3%", left: "49%", h: 150, rot: -12, op: 1, dur: 9, delay: -1 },
  { top: "14%", right: "11%", h: 58, rot: 14, op: 1, dur: 9, delay: -0.5 },
  { top: "18%", left: "8%", h: 28, rot: -26, op: 0.92, dur: 7.5, delay: -1.5 },
  // watch
  { top: "24%", right: "4%", h: 44, rot: 8, op: 0.95, dur: 8.5, delay: -2.5 },
  { top: "29%", left: "13%", h: 20, rot: 30, op: 0.88, dur: 7, delay: -1 },
  { top: "33%", right: "22%", h: 14, rot: -14, op: 0.72, dur: 6, delay: 0 },
  // how it works
  { top: "37%", left: "4%", h: 66, rot: -12, op: 1, dur: 10, delay: -3 },
  { top: "42%", right: "7%", h: 26, rot: 18, op: 0.9, dur: 8, delay: -1 },
  { top: "47%", left: "31%", h: 13, rot: -20, op: 0.7, dur: 6.5, delay: -2 },
  // features
  { top: "51%", right: "5%", h: 46, rot: 10, op: 1, dur: 9, delay: -0.5 },
  { top: "56%", left: "9%", h: 30, rot: -28, op: 0.92, dur: 7.5, delay: -2 },
  { top: "61%", right: "35%", h: 16, rot: 12, op: 0.72, dur: 6, delay: -1 },
  // faq
  { top: "65%", left: "6%", h: 24, rot: 22, op: 0.9, dur: 8, delay: -2.5 },
  { top: "69%", right: "9%", h: 56, rot: -16, op: 1, dur: 10, delay: -1.5 },
  { top: "74%", left: "38%", h: 14, rot: 8, op: 0.7, dur: 6.5, delay: 0 },
  // close + footer
  { top: "79%", right: "6%", h: 34, rot: 20, op: 0.95, dur: 8.5, delay: -2 },
  { top: "83%", left: "7%", h: 42, rot: -22, op: 0.95, dur: 9, delay: -1 },
  { top: "87%", right: "17%", h: 20, rot: 14, op: 0.88, dur: 7, delay: -0.5 },
  { top: "91%", left: "12%", h: 28, rot: -10, op: 0.9, dur: 8, delay: -2 },
  { top: "95%", right: "7%", h: 18, rot: 24, op: 0.85, dur: 7.5, delay: -1 },
];

export function BoltField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BOLTS.map((b, i) => (
        <span
          key={i}
          className="absolute hidden sm:block"
          style={{
            top: b.top,
            left: b.left,
            right: b.right,
            transform: `rotate(${b.rot}deg)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/bolt-3d-yellow.svg"
            alt=""
            className="block w-auto"
            style={{
              height: b.h,
              opacity: b.op,
              animation: `bob ${b.dur}s ease-in-out ${b.delay}s infinite`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
