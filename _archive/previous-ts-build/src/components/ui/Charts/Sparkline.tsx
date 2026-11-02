import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Stroke colour; defaults to the primary. */
  color?: string;
  filled?: boolean;
}

/**
 * Tiny inline SVG trend line. Decorative: the value it summarises must be
 * present as text nearby. Plain SVG (not Recharts) so it can sit inside
 * buttons and table cells.
 */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "var(--bh-chart-1)",
  filled = true,
}: SparklineProps) {
  // useId returns ":r1:" (React 18) or "«r1»" (React 19); keep url(#…) references valid.
  const gradientId = `bh-spark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pad = 2;

  const points = data.map((value, index) => [
    index * step,
    pad + (1 - (value - min) / range) * (height - pad * 2),
  ]);
  const line = points.map(([x, y]) => `${x!.toFixed(1)},${y!.toFixed(1)}`).join(" ");
  const last = points[points.length - 1]!;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      style={{ overflow: "visible", display: "block" }}
    >
      {filled && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,${height} ${line} ${width},${height}`} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
    </svg>
  );
}
