import React from "react";
import { Tag } from "antd";
import { STATUS_COLORS } from "constants/DashboardConstant";

/** Status tag in the portal's status colours. */
const StatusTag = ({ status }) => {
  const color = STATUS_COLORS[status];
  if (!color) return <Tag>{status}</Tag>;
  return (
    <Tag className="status-tag" style={{ background: color.light, color: color.text, borderColor: color.solid }}>
      {status}
    </Tag>
  );
};

export default StatusTag;
