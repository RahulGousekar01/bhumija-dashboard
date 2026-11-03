import React, { useId } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { formatMT, formatRupeesShort } from "../common/ChartCard/chartTheme";
import { stockData } from "../StockSummary/StockSummary";
import { processingData } from "../OreProcessing/OreProcessing";
import { permitData, permitsForPeriod } from "../PermitOverview/PermitOverview";
import { activePermitsFor, operationsData } from "../OperationsOverview/OperationsOverview";
import { PartyTag } from "../common/PeriodChip/PeriodChip";
import SectionPeriodFilter, { SectionPeriodChip, useSectionPeriod } from "../common/SectionPeriod/SectionPeriod";
import { paymentData } from "../PaymentSummary/PaymentSummary";
import OreFlow from "./OreFlow";
import ActivityTrend from "./ActivityTrend";
import { rangeFactor, scaleItems } from "./overviewData";
import { BreakdownList, Icon, getYesterday } from "./OverviewParts";
import "./DashboardOverview.css";

const sum = (items, pick) => items.reduce((total, item) => total + pick(item), 0);
const findOperation = (id) => operationsData.find((item) => item.id === id);

/**
 * Summary card: icon, label and headline figure.
 * With `popover`, the breakdown opens in a small pop-up on hover, focus or tap
 * (keeps the card compact); otherwise it is listed inside the card.
 */
function OverviewCard({ icon, label, value, items, note, popover = false, index = 0 }) {
  const popoverId = useId();

  if (!popover) {
    return (
      <div className="overview-card">
        <div className="overview-card-top">
          <span className="overview-card-icon">
            <Icon name={icon} />
          </span>
          <span className="overview-card-label">{label}</span>
        </div>
        <div className="overview-card-value">{value}</div>
        <BreakdownList items={items} note={note} />
      </div>
    );
  }

  return (
    <div
      className="overview-card overview-card-pop"
      style={{ "--bounce-delay": `${index * 90}ms` }}
      tabIndex={0}
      aria-describedby={popoverId}
    >
      <div className="overview-card-top">
        <span className="overview-card-icon">
          <Icon name={icon} />
        </span>
        <span className="overview-card-label">{label}</span>
      </div>
      <div className="overview-card-value">{value}</div>
      <span className="overview-card-hint" aria-hidden="true">
        View details
      </span>

      <div id={popoverId} className="overview-popover" role="tooltip">
        <div className="overview-popover-title">
          {label} <strong>{value}</strong>
        </div>
        <BreakdownList items={items} note={note} />
      </div>
    </div>
  );
}

const number = (value) => value.toLocaleString("en-IN");

function DashboardOverview() {
  const { filters, isParty } = useDashboard();
  const periodControl = useSectionPeriod("1");
  const { period } = periodControl;
  const yesterday = getYesterday();

  // How many "yesterdays" the chosen period adds up to (1 for yesterday).
  const volumeFactor = rangeFactor("volume", period.fromDaysAgo, period.toDaysAgo);
  const paymentFactor = rangeFactor("payment", period.fromDaysAgo, period.toDaysAgo);

  /* ---------- Figures from the sections below ---------- */
  const stockSources = Object.values(stockData);
  const totalStock = sum(stockSources, (source) => source.total);

  const processingSources = Object.values(processingData);
  const totalProcessed = sum(processingSources, (source) => source.total);
  const royaltyProcessed = processingData.royaltyPrimary.total + processingData.royaltySecondary.total;

  const permitsGenerated = sum(permitData, (permit) => permit.count);
  const activePermits = findOperation("active-permits");
  const activePermitCount = activePermitsFor(period);

  const totalPayments = sum(paymentData, (payment) => payment.total);
  const royaltyPayment = paymentData.find((payment) => payment.key === "royalty");
  const auctionPremium = paymentData.find((payment) => payment.key === "auctionPremium");

  // Cumulative for the financial year.
  const stockCard = {
    icon: "stock",
    label: `Total Stock · FY ${filters.financialYear}`,
    value: formatMT(totalStock),
    items: stockSources.map((source) => ({ label: source.title, value: `${number(source.total)} MT` })),
  };

  // Activity in the chosen period (yesterday by default). Totals are summed over
  // the period; Active Permits is the position at the end of yesterday.
  const processed = scaleItems(
    [
      { label: "eAuction", value: processingData.eauction.total },
      { label: "Royalty Paid", value: royaltyProcessed },
    ],
    volumeFactor
  );
  // Same figures as the Permit Overview cards.
  const permits = permitsForPeriod(period).map((permit) => ({
    label: permit.title.replace(" Permit", ""),
    value: permit.count,
  }));
  const payments = scaleItems(
    [
      { label: isParty ? "Royalty paid" : "Royalty", value: royaltyPayment.total },
      { label: isParty ? "Auction premium paid" : "Auction premium", value: auctionPremium.total },
    ],
    paymentFactor
  );

  const periodCards = [
    {
      icon: "processing",
      label: "Ore Processed",
      value: formatMT(Math.round(totalProcessed * volumeFactor)),
      items: processed.map((item) => ({ label: item.label, value: `${number(item.value)} MT` })),
    },
    {
      icon: "permit",
      label: "Permits Generated",
      value: number(sum(permits, (item) => item.value)),
      items: permits.map((item) => ({ label: item.label, value: number(item.value) })),
    },
    {
      icon: "active",
      label: "Active Permits",
      value: number(activePermitCount),
      note: period.isYesterday ? "Valid during yesterday, incl. earlier permits" : "Valid at any time in the period",
      items: scaleItems(
        activePermits.details.map((detail) => ({ label: detail.label.replace(" Permit", ""), value: detail.count })),
        activePermitCount / activePermits.count
      ).map((item) => ({ label: item.label, value: number(item.value) })),
    },
    {
      icon: "payment",
      // The department collects payments; a party makes them.
      label: isParty ? "Payment Made" : "Payment Collected",
      value: formatRupeesShort(Math.round(totalPayments * paymentFactor)),
      items: payments.map((item) => ({ label: item.label, value: formatRupeesShort(item.value) })),
    },
  ];

  return (
    <section className="dashboard-overview" aria-labelledby="overview-heading">
      <div className="overview-header section-head-period panel-head">
        <div>
          <h2 id="overview-heading">Overview</h2>
          <p>Figures are consolidated once a day and show data up to yesterday (T-1). Today's activity appears tomorrow.</p>
        </div>
        <div className="panel-head-actions">
          <SectionPeriodChip control={periodControl} />
          <PartyTag />
          <SectionPeriodFilter control={periodControl} label="Overview period" />
        </div>
      </div>

      <div className="overview-cards">
        <OverviewCard {...stockCard} />

        <div className="overview-yesterday" role="group" aria-labelledby="overview-yesterday-title">
          <div className="overview-yesterday-header">
            <Icon name="calendar" />
            <span id="overview-yesterday-title" aria-live="polite">
              {period.title} · <strong>{period.range}</strong>
            </span>
          </div>
          <div className="overview-yesterday-cards">
            {periodCards.map((card, index) => (
              <OverviewCard key={card.label} {...card} popover index={index} />
            ))}
          </div>
        </div>
      </div>

      <OreFlow range={period} periodLabel={`${period.title}, ${period.range}`} />

      {/* Daily chart only for periods of 30 days or less. */}
      {period.days <= 30 && (
        <div className="section-charts single">
          <ActivityTrend
            yesterday={yesterday.date}
            permitsYesterday={permitsGenerated}
            days={Math.min(Math.max(period.days, 7), 30)}
            toDaysAgo={period.toDaysAgo}
            lastLabel={period.toDaysAgo === 1 ? "Yesterday" : "Last day"}
          />
        </div>
      )}
    </section>
  );
}

export default DashboardOverview;
