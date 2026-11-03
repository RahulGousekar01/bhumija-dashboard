import React from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../common/ChartCard/ChartCard";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE, formatRupeesShort } from "../common/ChartCard/chartTheme";
import { processingData } from "../OreProcessing/OreProcessing";
import "./PaymentSummaryCharts.css";

/** ROM / Lumps / Fines amounts for a payment head (regional heads are summed over regions). */
const materialAmounts = (payment) => {
  const materials =
    payment.type === "regional"
      ? payment.regions.map((region) => region.materials)
      : [payment.materials];
  const total = (key) => materials.reduce((sum, item) => sum + item[key].amount, 0);
  return { ROM: total("rom"), Lumps: total("lumps"), Fines: total("fines") };
};

/*
 * Sample: share of lumps and fines in each Fe grade band, taken from the
 * processed ore. Replace with grade-wise payment figures from the API.
 */
const gradeShares = (material) => {
  const sources = Object.values(processingData);
  const bands = sources[0][material].grades.map((grade, index) => ({
    range: grade.range,
    quantity: sources.reduce((sum, source) => sum + source[material].grades[index].quantity, 0),
  }));
  const total = bands.reduce((sum, band) => sum + band.quantity, 0);
  return bands.map((band) => ({ range: band.range, share: band.quantity / total }));
};

/** Charts under the Payment Summary cards. */
function PaymentSummaryCharts({ payments }) {
  // Largest head first.
  const byMaterial = [...payments]
    .sort((a, b) => b.total - a.total)
    .map((payment) => ({ name: payment.title, ...materialAmounts(payment) }));

  const sumOf = (key) => byMaterial.reduce((sum, row) => sum + row[key], 0);
  const lumps = sumOf("Lumps");
  const fines = sumOf("Fines");
  const rom = sumOf("ROM");

  const lumpShares = gradeShares("lumps");
  const fineShares = gradeShares("fines");
  const byGrade = lumpShares.map((band, index) => ({
    range: band.range,
    Lumps: Math.round(lumps * band.share),
    Fines: Math.round(fines * fineShares[index].share),
  }));

  return (
    <div className="section-charts">
      <ChartCard
        title="Payment by Grade"
        subtitle={`Lumps + Fines ${formatRupeesShort(lumps + fines)} · all payment heads`}
        legend={[
          { label: "Lumps", color: CHART_COLORS.lumps },
          { label: "Fines", color: CHART_COLORS.fines },
        ]}
        footer={`ROM has no grade: ${formatRupeesShort(rom)} not shown here. Higher Fe % is better quality.`}
      >
        <BarChart data={byGrade} margin={{ top: 8, right: 8, left: 6, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f1f3f5" />
          <XAxis dataKey="range" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e5e9" }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatRupeesShort} width={72} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatRupeesShort(value)} cursor={{ fill: "#fff5f5" }} />
          <Bar dataKey="Lumps" stackId="grade" fill={CHART_COLORS.lumps} maxBarSize={44} />
          <Bar dataKey="Fines" stackId="grade" fill={CHART_COLORS.fines} radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ChartCard>

      <MaterialMatrix rows={byMaterial} />
    </div>
  );
}

/* =========================================
   Payments by material (shaded matrix)
========================================= */

const MATERIALS = ["ROM", "Lumps", "Fines"];

function MaterialMatrix({ rows }) {
  const totals = MATERIALS.map((material) => rows.reduce((sum, row) => sum + row[material], 0));
  const grandTotal = totals.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...rows.flatMap((row) => MATERIALS.map((material) => row[material])));

  const topIndex = totals.indexOf(Math.max(...totals));
  const share = (value) => (grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0);

  // Darker cell = larger amount.
  const shade = (value) => ({ background: `rgba(255, 107, 114, ${0.08 + (value / max) * 0.6})` });

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Payments by Material</h3>
        <span>Total {formatRupeesShort(grandTotal)}</span>
      </div>

      <div className="payment-matrix-wrap">
        <table className="payment-matrix">
          <caption className="payment-matrix-caption">
            Amount paid per head and material. Darker cells hold larger amounts.
          </caption>
          <thead>
            <tr>
              <th scope="col">Payment head</th>
              {MATERIALS.map((material) => (
                <th key={material} scope="col">{material}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                {MATERIALS.map((material) => (
                  <td key={material} style={shade(row[material])}>
                    {formatRupeesShort(row[material])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              {totals.map((value, index) => (
                <td key={MATERIALS[index]}>
                  {formatRupeesShort(value)}
                  <span>{share(value)}%</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="chart-card-footer">
        {MATERIALS[topIndex]} brings in the most: {formatRupeesShort(totals[topIndex])} ({share(totals[topIndex])}% of
        payments).
      </div>
    </div>
  );
}

export default PaymentSummaryCharts;
