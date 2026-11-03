import React from "react";
import CollapseButton, { useCollapsible } from "../common/SectionPanel/SectionPanel";
import { PartyTag } from "../common/PeriodChip/PeriodChip";
import SectionPeriodFilter, { SectionPeriodChip, useSectionPeriod } from "../common/SectionPeriod/SectionPeriod";
import { Icon } from "../DashboardOverview/OverviewParts";
import { rangeFactor } from "../DashboardOverview/overviewData";
import "./OperationsOverview.css";

/*
 * Sample figures as of the end of yesterday (T-1). Also read by the
 * Overview (Active Permits) and by Needs Attention (expiring, awaiting,
 * exceptions), so the ids and counts stay here.
 */
export const operationsData = [
  {
    id: "active-permits",
    title: "Active Permits",
    count: 248,
    label: "Valid at the end of yesterday",
    details: [
      { label: "Import", count: 72 },
      { label: "Export", count: 54 },
      { label: "Transit Permit", count: 86 },
      { label: "Sale Permit", count: 36 },
    ],
  },
  {
    id: "active-trips",
    title: "Active Trips",
    count: 96,
    label: "Still open at the end of yesterday",
    details: [
      { label: "Import", count: 28 },
      { label: "Export", count: 21 },
      { label: "Transit Permit", count: 33 },
      { label: "Sale Permit", count: 14 },
    ],
  },
  {
    id: "awaiting-action",
    title: "Awaiting Action",
    count: 31,
    label: "Pending at the end of yesterday",
    details: [
      { label: "Awaiting Approval", count: 8 },
      { label: "Awaiting Weighbridge", count: 12 },
      { label: "Awaiting Unloading", count: 7 },
      { label: "Other", count: 4 },
    ],
  },
  {
    id: "completed-trips",
    title: "Completed Trips",
    count: 186,
    label: "Completed yesterday",
    details: [
      { label: "Import", count: 54 },
      { label: "Export", count: 41 },
      { label: "Transit Permit", count: 64 },
      { label: "Sale Permit", count: 27 },
    ],
  },
  {
    id: "expiring-permits",
    title: "Expiring Permits",
    count: 18,
    label: "Due to expire, as of yesterday",
    details: [
      { label: "Within 3 Days", count: 4 },
      { label: "Within 7 Days", count: 7 },
      { label: "Within 30 Days", count: 7 },
    ],
  },
  {
    id: "exceptions",
    title: "Exceptions / Issues",
    count: 7,
    label: "Open at the end of yesterday",
    details: [
      { label: "Tripsheet Exception", count: 3 },
      { label: "Weighbridge Issue", count: 2 },
      { label: "Permit Issue", count: 1 },
      { label: "Other", count: 1 },
    ],
  },
];

// Sample: permits whose validity ended yesterday, split like the active permits.
const EXPIRED_YESTERDAY = 6;
// Sample: new permits issued per day, for permits valid over a longer period.
const NEW_PERMITS_PER_DAY = 86;

const findOperation = (id) => operationsData.find((item) => item.id === id);
const sumCounts = (details) => details.reduce((sum, item) => sum + item.count, 0);

/** Permits valid at any time in the period: yesterday's active permits plus earlier ones (sample). */
export const activePermitsFor = (period) => {
  const factor = rangeFactor("permits", period.fromDaysAgo, period.toDaysAgo);
  return Math.round(findOperation("active-permits").count + NEW_PERMITS_PER_DAY * (factor - 1) * 0.5);
};

/** Scales a breakdown, keeping its parts adding up to the scaled total. */
const scaleDetails = (details, total) => {
  const base = sumCounts(details);
  const scaled = details.map((item) => ({ ...item, count: Math.round((item.count / base) * total) }));
  scaled[scaled.length - 1].count += total - sumCounts(scaled);
  return scaled;
};

function OperationsOverview() {
  const periodControl = useSectionPeriod("1");
  const { period } = periodControl;

  const tripFactor = rangeFactor("volume", period.fromDaysAgo, period.toDaysAgo);
  const permitFactor = rangeFactor("permits", period.fromDaysAgo, period.toDaysAgo);

  const activePermits = findOperation("active-permits");
  const openTrips = findOperation("active-trips");
  const completed = findOperation("completed-trips");

  const completedCount = Math.round(completed.count * tripFactor);
  const permitCount = activePermitsFor(period);
  const tripCount = completedCount + openTrips.count;
  const expiredCount = Math.max(Math.round(EXPIRED_YESTERDAY * permitFactor), 0);

  const stats = [
    {
      key: "permits",
      icon: "permit",
      title: "Active Permits",
      value: permitCount,
      note: period.isYesterday ? "Valid during yesterday" : "Valid at any time in the period",
      details: scaleDetails(activePermits.details, permitCount),
    },
    {
      key: "trips",
      icon: "trip",
      title: "Active Trips",
      value: tripCount,
      note: `Trips run in the period: ${completedCount.toLocaleString("en-IN")} completed, ${openTrips.count} still open at its end`,
      details: scaleDetails(openTrips.details, tripCount),
    },
    {
      key: "completed",
      icon: "flag",
      title: "Completed Trips",
      value: completedCount,
      note: "Trips closed in the period",
      details: scaleDetails(completed.details, completedCount),
    },
    {
      key: "expiring",
      icon: "clock",
      title: "Expiring Permits",
      value: expiredCount,
      note: "Permits whose validity ended in the period",
      details: scaleDetails(activePermits.details, expiredCount),
    },
  ];

  const collapse = useCollapsible(false);

  return (
    <section className={`operations-section dash-panel${collapse.open ? "" : " collapsed"}`}>
      <div className="section-header section-head-period panel-head">
        <div>
          <h2>Operations Overview</h2>
          <p>Permits and trips for the selected period</p>
        </div>
        <div className="panel-head-actions">
          <SectionPeriodChip control={periodControl} />
          <PartyTag />
          <SectionPeriodFilter control={periodControl} label="Operations period" />
          <CollapseButton collapse={collapse} label="Operations Overview" />
        </div>
      </div>

      {collapse.open && (
        <>

      <div className="ops-board">
        <div className="ops-stats">
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className="ops-stat"
              tabIndex={0}
              aria-describedby={`ops-pop-${stat.key}`}
              style={{ "--bounce-delay": `${index * 70}ms` }}
            >
              <span className="ops-stat-icon">
                <Icon name={stat.icon} size={20} />
              </span>
              <div className="ops-stat-body">
                <span className="ops-stat-title">{stat.title}</span>
                <strong>{stat.value.toLocaleString("en-IN")}</strong>
                <span className="ops-stat-hint">By permit type ›</span>
              </div>

              <div className="ops-stat-pop" role="tooltip" id={`ops-pop-${stat.key}`}>
                <p>{stat.note}</p>
                <ul>
                  {stat.details.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.count.toLocaleString("en-IN")}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </section>
  );
}

export default OperationsOverview;
