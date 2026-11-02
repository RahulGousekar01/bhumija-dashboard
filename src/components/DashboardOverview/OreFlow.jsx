import React, { useId } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { formatMT, formatRupeesShort } from "../common/ChartCard/chartTheme";
import { buildOreFlow } from "./overviewData";
import { BreakdownList, Icon } from "./OverviewParts";

const total = (items) => items.reduce((sum, item) => sum + item.value, 0);

/** One step of the flow; hover, focus or tap shows its split in a pop-up. */
function FlowStage({ icon, label, caption, items, format }) {
  const popoverId = useId();
  const stageTotal = total(items);

  return (
    <div className="flow-stage" tabIndex={0} aria-describedby={popoverId}>
      <span className="flow-stage-icon">
        <Icon name={icon} size={22} />
      </span>
      <span className="flow-stage-label">{label}</span>
      <strong className="flow-stage-value">{format(stageTotal)}</strong>
      <span className="flow-stage-caption">{caption}</span>

      <div id={popoverId} className="overview-popover flow-popover" role="tooltip">
        <div className="overview-popover-title">
          {label} <strong>{format(stageTotal)}</strong>
        </div>
        <BreakdownList
          items={items.map((item) => ({
            label: item.label,
            value: `${format(item.value)} · ${Math.round((item.value / stageTotal) * 100)}%`,
          }))}
        />
      </div>
    </div>
  );
}

/**
 * The ore journey over the chosen period, as one connected line:
 * Extracted → Processed → In Stock → Transported → Payment.
 */
function OreFlow({ range, periodLabel }) {
  const { isParty } = useDashboard();
  const flow = buildOreFlow(range);

  const stages = [
    { icon: "extract", label: "Extracted", caption: "By source", items: flow.extracted, format: formatMT },
    { icon: "processing", label: "Processed", caption: "Into ROM, lumps, fines", items: flow.processed, format: formatMT },
    { icon: "stock", label: "In Stock", caption: "End of yesterday · block area, dump", items: flow.stock, format: formatMT },
    { icon: "trip", label: "Transported", caption: "Export, sale, transit", items: flow.transported, format: formatMT },
    {
      icon: "payment",
      label: isParty ? "Payment Made" : "Payment Collected",
      caption: "Royalty, eAuction, imported, dumps",
      items: flow.payment,
      format: formatRupeesShort,
    },
  ];

  return (
    <div className="ore-flow">
      <div className="ore-flow-header">
        <h3>Ore Flow</h3>
        <span>
          {periodLabel} · hover a step for its split
        </span>
      </div>

      <ol className="ore-flow-track">
        {stages.map((stage, index) => (
          <li key={stage.label} className="ore-flow-step">
            <FlowStage {...stage} />
            {index < stages.length - 1 && <span className="flow-arrow" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default OreFlow;
