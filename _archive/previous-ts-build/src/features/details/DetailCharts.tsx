import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "../../components/ui";

/*
 * Recharts wrappers used inside the drawer. Each one is wrapped in a
 * ChartFrame, which provides the accessible data table.
 */

const AXIS = { fontSize: 11, fill: "var(--bh-text-subtle)" };
const TOOLTIP_STYLE = {
  border: "1px solid var(--bh-border)",
  borderRadius: 8,
  boxShadow: "var(--bh-shadow-md)",
  fontSize: 12,
};
const SERIES_COLORS = ["var(--bh-chart-1)", "var(--bh-chart-4)", "var(--bh-chart-2)", "var(--bh-chart-3)"];

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export interface Series {
  key: string;
  label: string;
}

interface SeriesChartProps {
  title: string;
  subtitle?: string;
  /** Rows keyed by `category` plus one numeric field per series. */
  data: Record<string, string | number>[];
  category: string;
  series: Series[];
  format: (value: number) => string;
  /** Stack the series instead of grouping them. */
  stacked?: boolean;
  /** Horizontal bars, one row per category: better for long labels. */
  horizontal?: boolean;
  height?: number;
}

export function SeriesBarChart({
  title,
  subtitle,
  data,
  category,
  series,
  format,
  stacked = false,
  horizontal = false,
  height,
}: SeriesChartProps) {
  const chartHeight = height ?? (horizontal ? Math.max(160, data.length * 44 + 40) : 260);

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      height={chartHeight}
      table={{
        columns: [category === "label" ? "Item" : category, ...series.map((entry) => entry.label)],
        rows: data.map((row) => [
          String(row[category]),
          ...series.map((entry) => format(Number(row[entry.key] ?? 0))),
        ]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: 12, bottom: 0, left: horizontal ? 8 : -8 }}
          barCategoryGap={horizontal ? 10 : "20%"}
        >
          <CartesianGrid
            stroke="var(--bh-chart-grid)"
            vertical={horizontal}
            horizontal={!horizontal}
          />
          {horizontal ? (
            <>
              <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(value: number) => compact.format(value)} />
              <YAxis type="category" dataKey={category} tick={AXIS} tickLine={false} axisLine={false} width={150} />
            </>
          ) : (
            <>
              <XAxis dataKey={category} tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--bh-border)" }} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={52} tickFormatter={(value: number) => compact.format(value)} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--bh-brand-soft)" }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [format(Number(value)), name]}
          />
          {series.length > 1 && <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((entry, index) => (
            <Bar
              key={entry.key}
              dataKey={entry.key}
              name={entry.label}
              fill={SERIES_COLORS[index % SERIES_COLORS.length]}
              stackId={stacked ? "stack" : undefined}
              radius={stacked ? undefined : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={horizontal ? 22 : 36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
