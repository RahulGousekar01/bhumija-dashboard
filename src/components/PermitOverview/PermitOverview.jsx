import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { dayLabel } from "../../context/period";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import { BreakdownList } from "../DashboardOverview/OverviewParts";
import SectionPeriodFilter, { SectionPeriodChip, useSectionPeriod } from "../common/SectionPeriod/SectionPeriod";
import { dailyValues, rangeFactor } from "../DashboardOverview/overviewData";
import "./PermitOverview.css";
import PermitOverviewCharts from "./PermitOverviewCharts";

/*
 * Sample data for yesterday. status, quantity and parties are placeholders
 * until the permit API sends them. Other periods are scaled from these
 * figures (see permitsForPeriod).
 */
export const permitData = [
  {
    id: "import",
    title: "Import",
    count: 28,
    quantity: 14600,
    status: { approved: 22, pending: 4, rejected: 2 },

    categories: [
      { label: "Dumped (Auctioned)", count: 8 },
      { label: "Outside Goa", count: 10 },
      { label: "Outside India", count: 4 },
      { label: "Royalty Paid (Dump Allotted)", count: 6 },
    ],

    purposes: [
      { label: "End Use (Consumption)", count: 20 },
      { label: "Export", count: 8 },
    ],

    parties: [
      { party: "ABC Mining Pvt Ltd", count: 9, quantity: 4800 },
      { party: "XYZ Minerals", count: 7, quantity: 3900 },
      { party: "Goa Ore Industries", count: 6, quantity: 3100 },
      { party: "Others (3)", count: 6, quantity: 2800 },
    ],
  },

  {
    id: "export",
    title: "Export",
    count: 18,
    quantity: 9200,
    status: { approved: 15, pending: 2, rejected: 1 },

    categories: [
      { label: "Dump (Auctioned)", count: 4 },
      { label: "eAuction Lot", count: 3 },
      { label: "Imported (For Consumption)", count: 2 },
      { label: "Imported (For Export)", count: 3 },
      { label: "Royalty Paid", count: 4 },
      { label: "Royalty Paid (Dump Allotted)", count: 2 },
    ],

    purposes: [{ label: "Export", count: 18 }],

    parties: [
      { party: "ABC Mining Pvt Ltd", count: 6, quantity: 3400 },
      { party: "XYZ Minerals", count: 5, quantity: 2600 },
      { party: "Konkan Minerals", count: 4, quantity: 1900 },
      { party: "Others (2)", count: 3, quantity: 1300 },
    ],
  },

  {
    id: "transit",
    title: "Transit Permit",
    count: 24,
    quantity: 11800,
    status: { approved: 19, pending: 3, rejected: 2 },

    categories: [
      { label: "Dump (Auctioned)", count: 5 },
      { label: "eAuction Lot", count: 4 },
      { label: "Imported (For Consumption)", count: 3 },
      { label: "Imported (For Export)", count: 4 },
      { label: "Royalty Paid", count: 5 },
      { label: "Royalty Paid (Dump Auction)", count: 3 },
    ],

    purposes: [
      { label: "End Use (Consumption)", count: 15 },
      { label: "Movement", count: 9 },
    ],

    parties: [
      { party: "XYZ Minerals", count: 8, quantity: 4100 },
      { party: "ABC Mining Pvt Ltd", count: 7, quantity: 3500 },
      { party: "Goa Ore Industries", count: 5, quantity: 2400 },
      { party: "Others (3)", count: 4, quantity: 1800 },
    ],
  },

  {
    id: "sale",
    title: "Sale Permit",
    count: 16,
    quantity: 6400,
    status: { approved: 13, pending: 2, rejected: 1 },

    categories: [
      { label: "eAuction Lot", count: 7 },
      { label: "Royalty Paid", count: 9 },
    ],

    purposes: [{ label: "Sale", count: 16 }],

    parties: [
      { party: "Goa Ore Industries", count: 6, quantity: 2500 },
      { party: "Konkan Minerals", count: 5, quantity: 2000 },
      { party: "ABC Mining Pvt Ltd", count: 3, quantity: 1200 },
      { party: "Others (2)", count: 2, quantity: 700 },
    ],
  },
];

const STATUSES = [
  { key: "approved", label: "Approved", color: "#51cf66" },
  { key: "pending", label: "Pending", color: "#ffa94d" },
  { key: "rejected", label: "Rejected", color: "#ff6b72" },
];

const SOURCE_SHADES = ["#ff6b72", "#ff8a8f", "#ffa8ac", "#ffc9cc", "#ffe3e5", "#fff0f1"];
const PURPOSE_SHADES = ["#4dabf7", "#a5d8ff"];

const formatMT = (value) => `${value.toLocaleString("en-IN")} MT`;
const share = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);
const sumBy = (items, key) => items.reduce((sum, item) => sum + item[key], 0);

/** Scales count-like rows to a new total, keeping them adding up to it. */
const scaleRows = (rows, total, key = "count") => {
  const base = sumBy(rows, key);
  const scaled = rows.map((row) => ({ ...row, [key]: Math.round((row[key] / base) * total) }));
  scaled[scaled.length - 1][key] += total - sumBy(scaled, key);
  return scaled;
};

/**
 * Permits for the chosen period (sample: yesterday's figures scaled by the
 * daily pattern). Also gives each type a daily series for its trend chart,
 * at least 7 days long and ending on the period's last day.
 */
export function permitsForPeriod(period) {
  const factor = rangeFactor("permits", period.fromDaysAgo, period.toDaysAgo);
  // At most 30 bars, so long periods show their last 30 days.
  const trendFrom = Math.min(Math.max(period.fromDaysAgo, period.toDaysAgo + 6), period.toDaysAgo + 29);

  return permitData.map((permit) => {
    const count = Math.round(permit.count * factor);
    const statusRows = scaleRows(
      Object.entries(permit.status).map(([key, value]) => ({ key, count: value })),
      count
    );
    const parties = scaleRows(scaleRows(permit.parties, count), Math.round(permit.quantity * factor), "quantity");

    return {
      ...permit,
      count,
      quantity: Math.round(permit.quantity * factor),
      status: Object.fromEntries(statusRows.map((row) => [row.key, row.count])),
      categories: scaleRows(permit.categories, count),
      purposes: scaleRows(permit.purposes, count),
      parties,
      trend: dailyValues("permits", permit.count, trendFrom, period.toDaysAgo),
    };
  });
}

function PermitOverview() {
  const periodControl = useSectionPeriod("1");
  const { period } = periodControl;
  const permits = permitsForPeriod(period);
  const totalPermits = sumBy(permits, "count");

  const [selectedIndex, setSelectedIndex] = useState(null);
  const selectedPermit = selectedIndex === null ? null : permits[selectedIndex];

  const closeDetails = () => setSelectedIndex(null);
  const step = (offset) => setSelectedIndex((index) => (index + offset + permitData.length) % permitData.length);

  return (
    <section className="permit-section">
      <div className="section-header section-head-period">
        <div>
          <h2>Permit Overview</h2>
          <p>Permit applications received in the period, by type</p>
          <SectionPeriodChip control={periodControl} />
        </div>
        <SectionPeriodFilter control={periodControl} label="Permit period" />
      </div>

      {/* Main Permit Cards */}
      <div className="permit-grid">
        {permits.map((permit, index) => (
          <div
            className="permit-card overview-card-pop"
            key={permit.id}
            tabIndex={0}
            aria-describedby={`permit-pop-${permit.id}`}
            style={{ "--bounce-delay": `${index * 70}ms` }}
          >
            <span className="permit-card-title">{permit.title}</span>
            <span className="permit-card-count">{permit.count}</span>
            <span className="permit-card-label">
              {formatMT(permit.quantity)} · applied {period.phrase}
            </span>
            <button type="button" className="permit-card-link" onClick={() => setSelectedIndex(index)}>
              View details ›
            </button>

            {/* Status split on hover, like the Overview cards. */}
            <div id={`permit-pop-${permit.id}`} className="overview-popover" role="tooltip">
              <div className="overview-popover-title">
                {permit.title} <strong>{permit.count}</strong>
              </div>
              <BreakdownList
                note={`${formatMT(permit.quantity)} · applied ${period.phrase}`}
                items={STATUSES.map((status) => ({ label: status.label, value: permit.status[status.key] }))}
              />
            </div>
          </div>
        ))}
      </div>

      <PermitOverviewCharts permits={permits} />

      {selectedPermit && (
        <DetailDrawer
          open
          onClose={closeDetails}
          eyebrow="Permit Details"
          title={selectedPermit.title}
          description={`${selectedPermit.count} permits applied ${period.phrase}`}
          footer={
            <div className="permit-drawer-nav">
              <button type="button" onClick={() => step(-1)}>
                ‹ {permits[(selectedIndex - 1 + permits.length) % permits.length].title}
              </button>
              <button type="button" onClick={() => step(1)}>
                {permits[(selectedIndex + 1) % permits.length].title} ›
              </button>
            </div>
          }
        >
          <PermitDetail permit={selectedPermit} totalPermits={totalPermits} period={period} />
        </DetailDrawer>
      )}
    </section>
  );
}

/* =========================================
   DETAIL VIEW
========================================= */

function PermitDetail({ permit, totalPermits, period }) {
  const { isParty } = useDashboard();
  const approvedShare = share(permit.status.approved, permit.count);

  return (
    <div className="permit-detail">
      <div className="permit-detail-stats">
        <div>
          <span>Permits</span>
          <strong>{permit.count}</strong>
        </div>
        <div>
          <span>Quantity</span>
          <strong>{formatMT(permit.quantity)}</strong>
        </div>
        <div>
          <span>Approved</span>
          <strong>{approvedShare}%</strong>
        </div>
        <div>
          <span>Share of all permits</span>
          <strong>{share(permit.count, totalPermits)}%</strong>
        </div>
      </div>

      <div className="permit-detail-block">
        <h4>Status</h4>
        <SplitBar
          items={STATUSES.map((status) => ({ label: status.label, count: permit.status[status.key], color: status.color }))}
          total={permit.count}
          large
        />
      </div>

      <div className="permit-detail-columns">
        {/* Party users see only their own permits, so the ranking is for Super Admin. */}
        {!isParty && (
          <div className="permit-detail-block">
            <h4>Top parties</h4>
            <table className="permit-party-table">
              <thead>
                <tr>
                  <th scope="col">Party</th>
                  <th scope="col">Permits</th>
                  <th scope="col">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {permit.parties.map((row) => (
                  <tr key={row.party}>
                    <td>{row.party}</td>
                    <td>{row.count}</td>
                    <td>{formatMT(row.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="permit-detail-block">
          <h4>Daily permits · {permit.trend.length} days</h4>
          <PermitTrend trend={permit.trend} period={period} />
        </div>
      </div>

      <div className="permit-detail-columns">
        <div className="permit-detail-block">
          <h4>Ore source</h4>
          <SplitBar
            items={[...permit.categories]
              .sort((a, b) => b.count - a.count)
              .map((item, index) => ({ ...item, color: SOURCE_SHADES[index] ?? SOURCE_SHADES[5] }))}
            total={permit.count}
          />
        </div>

        <div className="permit-detail-block">
          <h4>Purpose</h4>
          <SplitBar
            items={[...permit.purposes]
              .sort((a, b) => b.count - a.count)
              .map((item, index) => ({ ...item, color: PURPOSE_SHADES[index] ?? PURPOSE_SHADES[1] }))}
            total={permit.count}
          />
        </div>
      </div>
    </div>
  );
}

/** One bar split into parts, with the parts listed under it. */
function SplitBar({ items, total, large }) {
  return (
    <>
      <div className={`permit-split-bar${large ? " large" : ""}`} aria-hidden="true">
        {items.map((item) => (
          <span key={item.label} style={{ width: `${share(item.count, total)}%`, background: item.color }} />
        ))}
      </div>

      <ul className="permit-split-legend">
        {items.map((item) => (
          <li key={item.label}>
            <i style={{ background: item.color }} aria-hidden="true" />
            {item.label} <strong>{item.count}</strong>
            <small>{share(item.count, total)}%</small>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Daily permits ending on the period's last day; days inside the period are highlighted. */
function PermitTrend({ trend, period }) {
  const values = trend.map((day) => day.value);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const last = values[values.length - 1];
  const difference = Math.round(((last - average) / average) * 100);

  const inPeriod = (day) => day.daysAgo <= period.fromDaysAgo && day.daysAgo >= period.toDaysAgo;
  const dayNumber = (day) => dayLabel(period.dateOf(day.daysAgo)).slice(0, 2);
  // Long periods label every few days so the dates stay readable.
  const labelEvery = Math.ceil(trend.length / 10);

  return (
    <>
      <div className="permit-trend" role="img" aria-label={`Daily permits: ${values.join(", ")}`}>
        <div className="permit-trend-bars">
          <span className="permit-trend-average" style={{ bottom: `${(average / max) * 100}%` }}>
            <em>avg {Math.round(average)}</em>
          </span>

          {trend.map((day, index) => (
            <span
              key={day.daysAgo}
              className={`permit-trend-bar${inPeriod(day) ? " in-period" : ""}`}
              style={{ height: `${(day.value / max) * 100}%` }}
              title={`${dayLabel(period.dateOf(day.daysAgo))}: ${day.value} permits`}
            >
              {index === trend.length - 1 && trend.length <= 10 && <b>{day.value}</b>}
            </span>
          ))}
        </div>

        <div className="permit-trend-labels">
          {trend.map((day, index) => (
            <small key={day.daysAgo}>
              {(trend.length - 1 - index) % labelEvery === 0 ? dayNumber(day) : ""}
            </small>
          ))}
        </div>
      </div>

      <p className="permit-trend-note">
        {period.toDaysAgo === 1 ? "Yesterday" : "Last day"} {last} · {Math.abs(difference)}%{" "}
        {difference >= 0 ? "above" : "below"} the {trend.length}-day average
      </p>
    </>
  );
}

export default PermitOverview;
