import React from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboard } from "../../context/DashboardContext";
import ChartCard from "../common/ChartCard/ChartCard";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE, formatRupeesShort } from "../common/ChartCard/chartTheme";
import { buildDailySeries } from "./overviewData";

/** Permits generated (bars) and payment (line) per day, ending on the period's last day. */
function ActivityTrend({ yesterday, permitsYesterday, days, toDaysAgo = 1, lastLabel = "Yesterday" }) {
  const { isParty } = useDashboard();
  const paymentLabel = isParty ? "Payment made" : "Payment collected";
  const series = buildDailySeries(yesterday, permitsYesterday, days, toDaysAgo);

  const average = Math.round(series.reduce((sum, day) => sum + day.permits, 0) / series.length);
  const last = series[series.length - 1];
  const difference = Math.round(((last.permits - average) / average) * 100);

  return (
    <ChartCard
      title={toDaysAgo === 1 ? `Last ${days} Days` : `${days} Days to ${last.day}`}
      subtitle="Daily figures · sample data until the daily figures are connected"
      height={240}
      legend={[
        { label: "Permits generated", color: CHART_COLORS.primary },
        { label: `${paymentLabel} (₹)`, color: CHART_COLORS.blue },
      ]}
      footer={`${lastLabel}: ${last.permits} permits, ${difference >= 0 ? "+" : ""}${difference}% against the ${days}-day average of ${average}.`}
    >
      <ComposedChart data={series} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#f1f3f5" />
        <XAxis
          dataKey="day"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "#e2e5e9" }}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis yAxisId="permits" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          yAxisId="payment"
          orientation="right"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={78}
          tickFormatter={formatRupeesShort}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "#fff5f5" }}
          formatter={(value, name) => (name === paymentLabel ? [formatRupeesShort(value), name] : [value, name])}
        />
        <Bar yAxisId="permits" dataKey="permits" name="Permits generated" radius={[4, 4, 0, 0]} maxBarSize={34}>
          {series.map((day, index) => (
            // Yesterday in full colour, earlier days lighter.
            <Cell key={day.day} fill={index === series.length - 1 ? CHART_COLORS.primary : "#ffc9cc"} />
          ))}
        </Bar>
        <Line
          yAxisId="payment"
          dataKey="payment"
          name={paymentLabel}
          type="monotone"
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          dot={days <= 15 ? { r: 3 } : false}
        />
      </ComposedChart>
    </ChartCard>
  );
}

export default ActivityTrend;
