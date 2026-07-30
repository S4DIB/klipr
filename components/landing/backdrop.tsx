/* One seamless surface for the whole page — matched to the PRODUCT.
 *
 * The Klipr app's desktop canvas is a calm, neutral light lavender-grey
 * (`#f4f3f7`) with white cards and violet accents — no colourful field. This
 * fixed layer reproduces that exact surface for the landing: the neutral canvas
 * plus a single whisper of Royal-Violet glow up top for brand life. Because it
 * is one fixed layer, no box edges run down the scroll, so no seam appears. */
export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{
        background: [
          "radial-gradient(70rem 44rem at 50% -14%, rgba(125,4,215,0.06), transparent 60%)",
          "#f4f3f7",
        ].join(","),
      }}
    >
      {/* whisper of dot-grid texture so the canvas isn't dead-flat, softly masked
          so it fades toward the edges — never a hard boundary */}
      <div
        className="dot-grid absolute inset-0 opacity-40"
        style={{
          maskImage:
            "radial-gradient(130% 110% at 50% 22%, #000 20%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(130% 110% at 50% 22%, #000 20%, transparent 90%)",
        }}
      />
    </div>
  );
}
