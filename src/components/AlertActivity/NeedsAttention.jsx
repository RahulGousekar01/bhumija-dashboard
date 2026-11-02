import React from "react";
import { useDashboard } from "../../context/DashboardContext";
import { operationsData } from "../OperationsOverview/OperationsOverview";
import { violationData } from "../MasterData/MasterData";

const find = (id) => operationsData.find((item) => item.id === id);

const splitText = (details) => details.map((detail) => `${detail.label} ${detail.count}`).join(" · ");

/** Items an officer (or party) should act on, as of yesterday. */
function NeedsAttention() {
  const { isParty } = useDashboard();
  const expiring = find("expiring-permits");
  const awaiting = find("awaiting-action");
  const exceptions = find("exceptions");
  const violations = isParty ? violationData.party : violationData.superAdmin;

  const items = [
    { tone: "critical", title: "Permits expiring", count: expiring.count, detail: splitText(expiring.details) },
    { tone: "warning", title: "Awaiting action", count: awaiting.count, detail: splitText(awaiting.details) },
    { tone: "warning", title: "Open exceptions", count: exceptions.count, detail: splitText(exceptions.details) },
    { tone: "critical", title: "Violations recorded", count: violations.count, detail: splitText(violations.details) },
  ];

  return (
    <div className="alert-panel attention-panel">
      <div className="panel-header">
        <div>
          <h3>Needs Attention</h3>
          <span>As of yesterday</span>
        </div>
      </div>

      <ul className="attention-list">
        {items.map((item) => (
          <li key={item.title} className={`attention-item attention-${item.tone}`}>
            <span className="attention-marker" aria-hidden="true" />
            <div className="attention-body">
              <div className="attention-title-row">
                <strong>{item.title}</strong>
                <span className="attention-count">{item.count}</span>
              </div>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NeedsAttention;
