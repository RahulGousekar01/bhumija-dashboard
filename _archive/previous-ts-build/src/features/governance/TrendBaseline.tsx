import { useState } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, SegmentedControl } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import { formatCrore, formatMT, formatNumber } from "../../lib/format";
import type { GovernanceSnapshot, TrendMetric } from "../../types/governance";
import styles from "./governance.module.css";

const METRICS = [
  { value: "dispatch", label: "Dispatch" },
  { value: "revenue", label: "Revenue" },
  { value: "permits", label: "Permits" },
] as const;

const FORMAT: Record<TrendMetric, (value: number) => string> = {
  dispatch: formatMT,
  revenue: formatCrore,
  permits: formatNumber,
};

const AXIS = { fontSize: 11, fill: "var(--bh-text-subtle)" };
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Daily actuals to the as-of date against a trailing 7-day average.
 * Days whose batch arrived late are drawn hatched and flagged in the table.
 */
export function TrendBaseline({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const [metric, setMetric] = useState<TrendMetric>("dispatch");
  const points = snapshot.trends[metric];
  const monthly = points.length > 0 && points[0]!.date.endsWith("-01") && points.length < 15 && points.every((point) => point.date.endsWith("-01"));
  const format = FORMAT[metric];
  const baselineLabel = monthly ? "3-month average" : "7-day average";
  const lateDays = points.filter((point) => point.lateBatch).length;

  return (
    <ChartFrame
      title="Trend vs baseline"
      subtitle={`${monthly ? "Monthly" : "Daily"} figures to ${formatDate(snapshot.asOf.asOfDate)} · consolidated T-1 data`}
      height={250}
      actions={<SegmentedControl label="Trend metric" options={METRICS} value={metric} onChange={setMetric} />}
      table={{
        columns: [monthly ? "Month" : "Date", "Actual", baselineLabel, "Batch"],
        rows: points.map((point) => [
          monthly ? point.label : formatDate(point.date),
          format(point.actual),
          format(point.baseline),
          point.lateBatch ? "Late / provisional" : "On time",
        ]),
      }}
      footer={
        <ul className={styles.legend} aria-hidden="true">
          <li>
            <span className={styles.swatch} style={{ background: "var(--bh-chart-1)" }} /> Actual
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchDash}`} /> {baselineLabel}
          </li>
          {lateDays > 0 && (
            <li>
              <span className={`${styles.swatch} ${styles.swatchHatch}`} /> Late batch ({lateDays})
            </li>
          )}
        </ul>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -6 }}>
          <defs>
            <pattern id="bh-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--bh-brand-muted)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--bh-chart-1)" strokeWidth="2" />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--bh-chart-grid)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--bh-border)" }} minTickGap={18} />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value: number) => compact.format(value)}
          />
          <Tooltip
            cursor={{ fill: "var(--bh-brand-soft)" }}
            contentStyle={{ border: "1px solid var(--bh-border)", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as (typeof points)[number] | undefined;
              if (!point) return "";
              return `${monthly ? point.label : formatDate(point.date)}${point.lateBatch ? " · late batch" : ""}`;
            }}
            formatter={(value, name) => [format(Number(value)), name]}
          />
          <Bar dataKey="actual" name="Actual" radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false}>
            {points.map((point) => (
              <Cell key={point.date} fill={point.lateBatch ? "url(#bh-hatch)" : "var(--bh-chart-1)"} />
            ))}
          </Bar>
          <Line
            dataKey="baseline"
            name={baselineLabel}
            type="monotone"
            stroke="var(--bh-chart-5)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
