import React from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { dayLabel } from "../../../context/period";
import { Icon, getYesterday } from "../../DashboardOverview/OverviewParts";
import "./PeriodChip.css";

/**
 * For sections that show a position (no period filter): from the start of the
 * selected financial year up to the end of yesterday, or to the end of a past year.
 */
function PeriodChip() {
  const { filters } = useDashboard();
  const startYear = Number(filters.financialYear.slice(0, 4));
  const yesterday = getYesterday().date;
  const yearEnd = new Date(Date.UTC(startYear + 1, 2, 31));
  const pastYear = yesterday > yearEnd;

  return (
    <span className="period-chip snapshot">
      <Icon name="clock" size={13} />
      01-Apr-{startYear} to {pastYear ? `31-Mar-${startYear + 1}` : dayLabel(yesterday)} · as of end of{" "}
      {pastYear ? `FY ${filters.financialYear}` : "day"}
    </span>
  );
}

/** Grey tag naming the party a Super Admin has filtered on. */
export function PartyTag() {
  const { filters, isParty } = useDashboard();
  if (isParty || filters.organisation === "ALL") return null;

  return (
    <span className="party-tag">
      <Icon name="active" size={13} />
      {filters.organisation}
    </span>
  );
}

export default PeriodChip;
