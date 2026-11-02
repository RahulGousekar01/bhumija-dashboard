import React from "react";
import { Card, Col, Row } from "antd";
import { PERMIT_TYPES } from "constants/DashboardConstant";
import { formatMT, formatNumber } from "utils/dateUtils";

/* ---------- Permits by type ---------- */

export const PermitsByTypeCard = ({ permits }) => {
  const rows = PERMIT_TYPES.map((type) => ({
    type,
    count: permits.filter((permit) => permit.permittype === type).length,
    approved: permits.filter((permit) => permit.permittype === type && permit.status === "Approved").length,
  }));
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <Card className="dashboard-card" title="Permits by Type" extra={<span className="card-extra">Applications this FY</span>}>
      <ul className="bar-list">
        {rows.map((row) => (
          <li key={row.type}>
            <div className="bar-list-label">
              <span>{row.type}</span>
              <strong>{formatNumber(row.count)}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span className="bar-fill" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
            <span className="bar-list-note">{formatNumber(row.approved)} approved</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

/* ---------- Transit: trip sheets on the T-1 day ---------- */

export const TransitCard = ({ summary, activeTransitPermits }) => (
  <Card className="dashboard-card" title="Transit (Trip Sheets)" extra={<span className="card-extra">Yesterday</span>}>
    <Row gutter={[12, 12]}>
      <Col span={12}>
        <Figure label="Trip sheets generated" value={formatNumber(summary.generated)} />
      </Col>
      <Col span={12}>
        <Figure label="Quantity transported" value={formatMT(summary.quantity)} />
      </Col>
      <Col span={12}>
        <Figure label="Closed (delivered)" value={formatNumber(summary.closed)} />
      </Col>
      <Col span={12}>
        <Figure label="Open (in transit)" value={formatNumber(summary.intransit)} />
      </Col>
      <Col span={12}>
        <Figure label="Road / Barge" value={`${formatNumber(summary.road)} / ${formatNumber(summary.barge)}`} />
      </Col>
      <Col span={12}>
        <Figure label="Active transit permits" value={formatNumber(activeTransitPermits)} />
      </Col>
    </Row>
  </Card>
);

/* ---------- Stock position ---------- */

export const StockCard = ({ stock }) => {
  const total = stock.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <Card className="dashboard-card" title="Stock Position" extra={<span className="card-extra">End of day, yesterday</span>}>
      <Figure label="Total stock" value={formatMT(total)} large />
      <ul className="bar-list stock-list">
        {stock.map((row) => (
          <li key={row.source}>
            <div className="bar-list-label">
              <span>{row.source}</span>
              <strong>{formatMT(row.quantity)}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span className="bar-fill" style={{ width: `${total ? (row.quantity / total) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

/* ---------- Shared ---------- */

const Figure = ({ label, value, large }) => (
  <div className={`figure ${large ? "figure-large" : ""}`}>
    <span className="figure-label">{label}</span>
    <span className="figure-value">{value}</span>
  </div>
);
