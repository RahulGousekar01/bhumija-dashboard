import React from "react";
import { dayLabel } from "../../../context/period";
import { Icon, getYesterday } from "../../DashboardOverview/OverviewParts";
import "./PeriodChip.css";

/** For sections that show a position at the end of yesterday (no period filter). */
function PeriodChip() {
  return (
    <span className="period-chip snapshot">
      <Icon name="clock" size={13} />
      As of end of yesterday · {dayLabel(getYesterday().date)}
    </span>
  );
}

export default PeriodChip;
