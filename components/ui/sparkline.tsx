import { useId } from "react";

/**
 * Hand-rolled SVG sparkline. Polyline + soft gradient area, zero deps.
 * Feed it real snapshot values only. Renders nothing (an honest dash) for
 * fewer than 2 points instead of inventing a curve.
 */
export function Sparkline({
  points,
  width = 220,
  height = 56,
  stroke = "var(--volt-500)",
  className,
}: {
  points: number[];
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}) {
  const gid = useId().replace(/[:]/g, "");

  if (points.length < 2) {
    return (
      <div
        className={className}
        style={{ width, height }}
        aria-label="Not enough data yet"
      >
        <div className="flex h-full items-center">
          <span className="hairline" />
        </div>
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const px = 2; // stroke padding so the line never clips
  const step = (width - px * 2) / (points.length - 1);
  const y = (v: number) => px + (height - px * 2) * (1 - (v - min) / span);
  const pts = points.map((v, i) => [px + i * step, y(v)] as const);
  const line = pts.map(([x, yy]) => `${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const area = `${px},${height} ${line} ${(px + (points.length - 1) * step).toFixed(1)},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Trend from ${min.toLocaleString("en-US")} to ${points[points.length - 1].toLocaleString("en-US")}`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="2.5"
        fill={stroke}
      />
    </svg>
  );
}
