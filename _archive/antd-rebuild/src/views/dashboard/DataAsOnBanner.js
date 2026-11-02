import React from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { DATE_FORMAT } from "constants/DashboardConstant";

/**
 * The dashboard never shows live data. Every figure is the previous day's
 * consolidated data; this stamp says so at the top of the page.
 */
const DataAsOnBanner = ({ asOnDate }) => (
  <div className="data-as-on" role="note" aria-label="Data recency">
    <CalendarOutlined className="data-as-on-icon" aria-hidden="true" />
    <div className="data-as-on-text">
      <strong>
        Data as of: Yesterday (T-1), {asOnDate.format(DATE_FORMAT)}, 11:59 PM
      </strong>
      <span>All figures are the previous day's consolidated data, updated once a day. Today's transactions appear tomorrow.</span>
    </div>
    <span className="data-as-on-badge">T-1</span>
  </div>
);

export default DataAsOnBanner;
