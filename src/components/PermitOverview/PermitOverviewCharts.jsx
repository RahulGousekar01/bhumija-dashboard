import React from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../common/ChartCard/ChartCard";
import { AXIS_TICK, PALETTE, TOOLTIP_STYLE } from "../common/ChartCard/chartTheme";
import "./PermitOverviewCharts.css";

/** Charts under the Permit Overview cards; `permits` are already scaled to the chosen period. */
function PermitOverviewCharts({ permits }) {
  // Purpose split for each permit type (stacked).
  const purposes = [...new Set(permits.flatMap((permit) => permit.purposes.map((item) => item.label)))];
  const byPurpose = permits.map((permit) => ({
    name: permit.title.replace(" Permit", ""),
    ...Object.fromEntries(purposes.map((purpose) => [purpose, permit.purposes.find((item) => item.label === purpose)?.count ?? 0])),
  }));

  return (
    <div className="section-charts">
      <ChartCard
        title="Purpose of Permits"
        subtitle="By permit type"
        legend={purposes.map((purpose, index) => ({ label: purpose, color: PALETTE[index] }))}
      >
        <BarChart data={byPurpose} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f1f3f5" />
          <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e5e9" }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#fff5f5" }} />
          {purposes.map((purpose, index) => (
            <Bar
              key={purpose}
              dataKey={purpose}
              stackId="purpose"
              fill={PALETTE[index]}
              radius={index === purposes.length - 1 ? [4, 4, 0, 0] : undefined}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ChartCard>

      <SourceMatrix permits={permits} />
    </div>
  );
}

/* =========================================
   Ore source × permit type (shaded matrix)
========================================= */

/*
 * Ore source categories grouped into families. The permit data spells
 * some categories differently ("Dumped (Auctioned)" / "Dump (Auctioned)"),
 * so both spellings map to the same family.
 */
const SOURCE_FAMILIES = [
  { label: "Royalty paid", categories: ["Royalty Paid", "Royalty Paid (Dump Allotted)", "Royalty Paid (Dump Auction)"] },
  { label: "Dump auctioned", categories: ["Dump (Auctioned)", "Dumped (Auctioned)"] },
  { label: "Outside Goa / India", categories: ["Outside Goa", "Outside India"] },
  { label: "eAuction lot", categories: ["eAuction Lot"] },
  { label: "Imported", categories: ["Imported (For Consumption)", "Imported (For Export)"] },
];

const familyOf = (category) => SOURCE_FAMILIES.find((family) => family.categories.includes(category))?.label ?? "Other";

function SourceMatrix({ permits }) {
  const types = permits.map((permit) => ({ id: permit.id, name: permit.title.replace(" Permit", "") }));

  // One row per family; each cell keeps the categories behind its count for the hover text.
  const rows = [...SOURCE_FAMILIES.map((family) => family.label), "Other"]
    .map((label) => ({
      label,
      cells: permits.map((permit) => {
        const items = permit.categories.filter((item) => familyOf(item.label) === label);
        return { count: items.reduce((sum, item) => sum + item.count, 0), items };
      }),
    }))
    .map((row) => ({ ...row, total: row.cells.reduce((sum, cell) => sum + cell.count, 0) }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const typeTotals = types.map((_, index) => rows.reduce((sum, row) => sum + row.cells[index].count, 0));
  const grandTotal = typeTotals.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...rows.flatMap((row) => row.cells.map((cell) => cell.count)));
  const top = rows[0];

  // Darker cell = more permits.
  const shade = (count) => ({ background: `rgba(255, 107, 114, ${0.1 + (count / max) * 0.58})` });

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Ore Source by Permit Type</h3>
        <span>{grandTotal} permits</span>
      </div>

      <div className="source-matrix-wrap">
        <table className="source-matrix">
          <caption className="source-matrix-caption">
            Permits per ore source and permit type. Hover a cell for the categories inside it.
          </caption>
          <thead>
            <tr>
              <th scope="col">Ore source</th>
              {types.map((type) => (
                <th key={type.id} scope="col">{type.name}</th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.cells.map((cell, index) =>
                  cell.count > 0 ? (
                    <td
                      key={types[index].id}
                      style={shade(cell.count)}
                      title={cell.items.map((item) => `${item.label}: ${item.count}`).join("\n")}
                    >
                      {cell.count}
                    </td>
                  ) : (
                    <td key={types[index].id} className="empty" aria-label="None">
                      –
                    </td>
                  )
                )}
                <td className="total">{row.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              {typeTotals.map((value, index) => (
                <td key={types[index].id}>{value}</td>
              ))}
              <td>{grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="chart-card-footer">
        {top.label} is the main ore source: {top.total} of {grandTotal} permits (
        {Math.round((top.total / grandTotal) * 100)}%).
      </div>
    </div>
  );
}

export default PermitOverviewCharts;
