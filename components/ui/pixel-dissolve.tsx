/* 8-bit dissolve strip: squares of `color` crumble in over whatever is behind,
 * sparse → dense from top to bottom. Pin it to the bottom of a section whose
 * successor's background is `color` and the two melt into each other. */
export function PixelDissolve({ color }: { color: string }) {
  const rows = [
    { on: 12, period: 72, offset: 24 },
    { on: 12, period: 36, offset: 0 },
    { on: 24, period: 36, offset: 12 },
    { on: 60, period: 72, offset: 36 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0">
      {rows.map((r, i) => (
        <div
          key={i}
          className="h-3"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 ${r.on}px, transparent ${r.on}px ${r.period}px)`,
            backgroundPositionX: `${r.offset}px`,
          }}
        />
      ))}
    </div>
  );
}
