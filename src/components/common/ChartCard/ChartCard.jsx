import React from "react";
import { ResponsiveContainer } from "recharts";
import "./ChartCard.css";

/**
 * White card with a title and a responsive chart.
 * `legend` is an optional list of { label, color } shown under the chart.
 */
function ChartCard({ title, subtitle, height = 240, legend, children, footer }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>{title}</h3>
        {subtitle && <span>{subtitle}</span>}
      </div>

      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>

      {legend && (
        <div className="chart-card-legend">
          {legend.map((item) => (
            <span key={item.label}>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      {footer && <div className="chart-card-footer">{footer}</div>}
    </div>
  );
}

export default ChartCard;
