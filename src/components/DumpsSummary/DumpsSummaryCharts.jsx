import React from "react";
import { useDashboard } from "../../context/DashboardContext";
import { formatMT } from "../common/ChartCard/chartTheme";
import { dumpData } from "./DumpsSummary";
import "./DumpsSummaryCharts.css";

const shortName = (party) => party.replace(" Pvt Ltd", "");
const formatMillion = (value) => `${(value / 1000000).toFixed(1)} M MT`;
const share = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

// Largest party gets the darkest shade.
const BUBBLE_SHADES = ["#ff6b72", "#ff8a8f", "#ffa8ac", "#ffc9cc", "#ffe3e5"];
const BUBBLE_MAX = 132;

// Tonnes per square, so the grid stays around 50 squares.
const UNIT_STEPS = [100, 250, 500, 1000, 2500, 5000, 10000, 25000];
const pickUnit = (total) => UNIT_STEPS.find((step) => total / step <= 60) ?? UNIT_STEPS[UNIT_STEPS.length - 1];

/** Charts under the Dumps Summary cards. */
function DumpsSummaryCharts() {
  const { isParty } = useDashboard();

  // A Party sees only its own row (as in the cards).
  const extractionRows = isParty ? dumpData.extracted.parties.slice(0, 1) : dumpData.extracted.parties;

  return (
    <div className="section-charts">
      <AllotmentBubbles />
      <ExtractionGrid rows={extractionRows} />
    </div>
  );
}

/* =========================================
   1. Annual dump allotment by party
========================================= */

function AllotmentBubbles() {
  const parties = dumpData.annualTotal.allocation
    .map((row) => {
      const eauction = dumpData.annualTotal.eauction.find((item) => item.party === row.party)?.allocated ?? 0;
      return { party: row.party, allocation: row.allocated, eauction, total: row.allocated + eauction };
    })
    .sort((a, b) => b.total - a.total);

  const grandTotal = parties.reduce((sum, row) => sum + row.total, 0);
  const allocationTotal = parties.reduce((sum, row) => sum + row.allocation, 0);
  const largest = parties[0]?.total ?? 0;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Annual Dump Allotment by Party</h3>
        <span>Total {formatMillion(grandTotal)}</span>
      </div>

      <ul className="dump-bubbles">
        {parties.map((row, index) => {
          // Area, not diameter, follows the allotment.
          const size = Math.round(BUBBLE_MAX * Math.sqrt(row.total / largest));
          return (
            <li
              key={row.party}
              className="dump-bubble"
              tabIndex={0}
              style={{ width: size, height: size, background: BUBBLE_SHADES[index] ?? BUBBLE_SHADES[4] }}
            >
              <span className="dump-bubble-name">{shortName(row.party)}</span>
              <strong>{(row.total / 1000000).toFixed(1)} M</strong>

              <div className="dump-bubble-pop" role="tooltip">
                <b>{row.party}</b>
                <span>Allocation <em>{formatMillion(row.allocation)}</em></span>
                <span>eAuction <em>{formatMillion(row.eauction)}</em></span>
                <span>Share <em>{share(row.total, grandTotal)}%</em></span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="chart-card-footer">
        Bubble size shows each party's allotment. Allocation {formatMillion(allocationTotal)} · eAuction{" "}
        {formatMillion(grandTotal - allocationTotal)}.
      </div>
    </div>
  );
}

/* =========================================
   2. Extracted vs transported
========================================= */

function ExtractionGrid({ rows }) {
  const extracted = rows.reduce((sum, row) => sum + row.extracted, 0);
  const transported = rows.reduce((sum, row) => sum + row.transported, 0);
  const inGeofence = Math.max(extracted - transported, 0);

  const unit = pickUnit(extracted);
  const cells = Math.round(extracted / unit);
  const movedCells = Math.round(transported / unit);

  return (
    <div className="chart-card unit-card">
      <div className="chart-card-header">
        <h3>Extracted vs Transported</h3>
        <span>{share(transported, extracted)}% moved out of the dump</span>
      </div>

      <div className="unit-chart">
        <div
          className="unit-grid"
          role="img"
          aria-label={`${formatMT(transported)} transported of ${formatMT(extracted)} extracted`}
        >
          {Array.from({ length: cells }, (_, index) => (
            <i key={index} className={index < movedCells ? "moved" : undefined} />
          ))}
        </div>

        <dl className="unit-stats">
          <div>
            <dt>Extracted</dt>
            <dd>{formatMT(extracted)}</dd>
          </div>
          <div>
            <dt><i className="unit-key moved" aria-hidden="true" />Transported</dt>
            <dd>{formatMT(transported)}</dd>
          </div>
          <div>
            <dt><i className="unit-key" aria-hidden="true" />In geofence</dt>
            <dd>{formatMT(inGeofence)}</dd>
          </div>
        </dl>
      </div>

      <div className="chart-card-footer">Each square is {unit.toLocaleString("en-IN")} MT.</div>
    </div>
  );
}

export default DumpsSummaryCharts;
