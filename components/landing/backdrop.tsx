/* One seamless hero-world for the whole page — NO divides, ever.
 *
 * This is a single FIXED, viewport-sized layer: solid Dark Amethyst, an
 * electric pixel-grid, soft ambient brand-color glows, and a vignette. Because
 * it is one fixed layer (not a stack of page-height boxes), there are no box
 * edges running down the scroll, so no horizontal seam can appear. Every
 * section scrolls over this same, unchanging atmosphere. */
export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ background: "var(--volt-600)" }}
    >
      {/* electric square grid — softly masked so it fades toward the edges,
          never with a hard boundary */}
      <div
        className="pixel-grid absolute inset-0 opacity-70"
        style={{
          maskImage:
            "radial-gradient(130% 110% at 50% 28%, #000 25%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(130% 110% at 50% 28%, #000 25%, transparent 92%)",
        }}
      />

      {/* ambient brand-color glows in the corners — each a soft radial that
          fully fades to transparent, so no edges. Same light in every section. */}
      <div className="pixel-cells absolute inset-0">
        <div
          className="absolute -right-[12%] -top-[14%] h-[75vh] w-[55vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(125,4,215,0.55), transparent 66%)" }}
        />
        <div
          className="absolute -right-[10%] top-[18%] h-[55vh] w-[42vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,123,192,0.24), transparent 66%)" }}
        />
        <div
          className="absolute -left-[14%] top-[34%] h-[62vh] w-[48vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(125,4,215,0.4), transparent 66%)" }}
        />
        <div
          className="absolute -left-[10%] bottom-[-12%] h-[60vh] w-[46vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(250,255,71,0.13), transparent 66%)" }}
        />
        <div
          className="absolute -right-[12%] bottom-[-14%] h-[58vh] w-[44vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,249,197,0.12), transparent 66%)" }}
        />
      </div>

      {/* vignette — one full layer, darkens the corners so the middle feels lit */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 22%, transparent 45%, rgba(12,0,24,0.5) 100%)",
        }}
      />
    </div>
  );
}
