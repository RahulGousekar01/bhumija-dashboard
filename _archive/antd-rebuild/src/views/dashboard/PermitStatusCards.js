import React from "react";
import { Col, Row } from "antd";
import { PERMIT_STATUSES, STATUS_COLORS } from "constants/DashboardConstant";
import { formatNumber } from "utils/dateUtils";

/**
 * Permit application counts by status. Selecting a card filters the
 * permit table below (same behaviour as the portal's Permit List counts).
 */
const PermitStatusCards = ({ permits, activeStatus, onSelect }) => {
  const counts = PERMIT_STATUSES.map((status) => ({
    status,
    count: permits.filter((permit) => permit.status === status).length,
  }));

  const cards = [{ status: null, label: "Total Applications", count: permits.length }, ...counts.map((item) => ({ ...item, label: item.status }))];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => {
        const color = card.status ? STATUS_COLORS[card.status] : null;
        const active = activeStatus === card.status;
        return (
          <Col key={card.label} xs={12} sm={8} xl={4}>
            <button
              type="button"
              className={`status-card ${active ? "status-card-active" : ""}`}
              style={color ? { "--status-color": color.solid, "--status-light": color.light } : undefined}
              aria-pressed={active}
              onClick={() => onSelect(active ? null : card.status)}
            >
              <span className="status-card-label">
                {color && <span className="status-dot" aria-hidden="true" />}
                {card.label}
              </span>
              <span className="status-card-count">{formatNumber(card.count)}</span>
              <span className="status-card-hint">{active ? "Showing in table" : "View in table"}</span>
            </button>
          </Col>
        );
      })}
    </Row>
  );
};

export default PermitStatusCards;
