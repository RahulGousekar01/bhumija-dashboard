import React, { useState } from "react";
import { getStockByView, stockData } from "./StockSummary";
import "./StockSummaryCharts.css";

const formatMT = (value) => `${value.toLocaleString("en-IN")} MT`;
const materialTotal = (stock) => stock.rom + stock.lumps.total + stock.fines.total;

// Grade bands of 55% Fe and above are treated as high grade.
const isHighGrade = (range) => parseInt(range, 10) >= 55;

const MATERIALS = [
  { key: "both", label: "Lumps + Fines" },
  { key: "lumps", label: "Lumps" },
  { key: "fines", label: "Fines" },
];

/** Charts under the Stock Summary cards. */
function StockSummaryCharts() {
  const sources = Object.values(stockData);

  return (
    <div className="section-charts">
      <StockAvailability sources={sources} />
      <GradeGrid sources={sources} />
    </div>
  );
}

/* =========================================
   1. How much stock is still available to move
========================================= */

function StockAvailability({ sources }) {
  // Same calculation as the stock drawer's Transported / Balance views.
  const rows = sources.map((source) => {
    const total = materialTotal(getStockByView(source, "total"));
    const transported = materialTotal(getStockByView(source, "transported"));
    const balance = materialTotal(getStockByView(source, "balance"));
    return { title: source.title, total, transported, balance };
  });

  const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0);
  const totalStock = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Stock Available to Move</h3>
        <span>
          {formatMT(totalBalance)} of {formatMT(totalStock)} still available
        </span>
      </div>

      <ul className="availability-list">
        {rows.map((row) => {
          const availableShare = Math.round((row.balance / row.total) * 100);
          return (
            <li key={row.title}>
              <div className="availability-head">
                <strong>{row.title}</strong>
                <span>{formatMT(row.total)}</span>
              </div>

              <div className="availability-bar" aria-hidden="true">
                <span className="availability-moved" style={{ width: `${100 - availableShare}%` }} />
                <span className="availability-left" style={{ width: `${availableShare}%` }} />
              </div>

              <div className="availability-figures">
                <span>
                  <i className="dot dot-moved" aria-hidden="true" />
                  Transported {formatMT(row.transported)}
                </span>
                <span>
                  <i className="dot dot-left" aria-hidden="true" />
                  Available {formatMT(row.balance)} ({availableShare}%)
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================
   2. Where the good-grade stock is
========================================= */

function GradeGrid({ sources }) {
  const [material, setMaterial] = useState("both");
  const ranges = sources[0].lumps.grades.map((grade) => grade.range);

  const quantity = (source, index) => {
    const lumps = source.lumps.grades[index].quantity;
    const fines = source.fines.grades[index].quantity;
    return material === "lumps" ? lumps : material === "fines" ? fines : lumps + fines;
  };

  const rows = sources.map((source) => ({
    title: source.title,
    cells: ranges.map((_, index) => quantity(source, index)),
  }));
  const totals = ranges.map((_, index) => rows.reduce((sum, row) => sum + row.cells[index], 0));
  const max = Math.max(...rows.flatMap((row) => row.cells));

  const graded = totals.reduce((sum, value) => sum + value, 0);
  const highGrade = totals.filter((_, index) => isHighGrade(ranges[index])).reduce((sum, value) => sum + value, 0);

  // Darker cell = more tonnes.
  const shade = (value) => ({ background: `rgba(255, 107, 114, ${0.08 + (value / max) * 0.6})` });

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Where the Good-Grade Stock Is</h3>
        <div className="grade-toggle" role="group" aria-label="Material">
          {MATERIALS.map((item) => (
            <button key={item.key} type="button" aria-pressed={material === item.key} onClick={() => setMaterial(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grade-grid-wrap">
        <table className="grade-grid">
          <caption className="grade-grid-caption">
            Stock (MT) by source and Fe grade. Darker cells hold more stock.
          </caption>
          <thead>
            <tr>
              <th scope="col">Source</th>
              {ranges.map((range) => (
                <th key={range} scope="col" className={isHighGrade(range) ? "high-grade" : undefined}>
                  {range}
                  {isHighGrade(range) && <span>High grade</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.title}>
                <th scope="row">{row.title}</th>
                {row.cells.map((value, index) => (
                  <td key={ranges[index]} style={shade(value)}>
                    {value.toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              {totals.map((value, index) => (
                <td key={ranges[index]}>{value.toLocaleString("en-IN")}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="chart-card-footer">
        {Math.round((highGrade / graded) * 100)}% of {material === "both" ? "graded" : material} stock (
        {formatMT(highGrade)}) is 55% Fe or above.
      </div>
    </div>
  );
}

export default StockSummaryCharts;
