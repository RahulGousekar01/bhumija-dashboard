import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../common/ChartCard/ChartCard";
import { AXIS_TICK, PALETTE, TOOLTIP_STYLE, formatRupeesShort } from "../common/ChartCard/chartTheme";
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

/** Charts under the Payment Summary cards. */
function PaymentSummaryCharts({ payments }) {
  const totals = [...payments]
    .sort((a, b) => b.total - a.total)
    .map((payment) => ({ name: payment.title, amount: payment.total }));
  const grandTotal = totals.reduce((sum, item) => sum + item.amount, 0);

  // Same order as the collection chart: largest head first.
  const byMaterial = [...payments]
    .sort((a, b) => b.total - a.total)
    .map((payment) => ({ name: payment.title, ...materialAmounts(payment) }));

  return (
    <div className="section-charts">
      <ChartCard
        title="Collection by Payment Head"
        subtitle={`Total ${formatRupeesShort(grandTotal)}`}
        footer="DMF and GIOPF include North and South regions."
      >
        <BarChart data={totals} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#f1f3f5" />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatRupeesShort} />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={120} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatRupeesShort(value)} cursor={{ fill: "#fff5f5" }} />
          <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {totals.map((item, index) => (
              <Cell key={item.name} fill={PALETTE[index]} />
            ))}
          </Bar>
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
