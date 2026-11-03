import React, { useState } from "react";
import CollapseButton, { useCollapsible } from "../common/SectionPanel/SectionPanel";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { dailyValues, dayLabel, rangeFactor } from "../../context/period";
import ChartCard from "../common/ChartCard/ChartCard";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE, formatRupeesShort } from "../common/ChartCard/chartTheme";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import { PartyTag } from "../common/PeriodChip/PeriodChip";
import SectionPeriodFilter, { SectionPeriodChip, useSectionPeriod } from "../common/SectionPeriod/SectionPeriod";
import "./PaymentSummary.css";
import PaymentSummaryCharts from "./PaymentSummaryCharts";

/*
 * Payment heads shown on the main dashboard.
 *
 * Region is intentionally NOT part of the payment-head name.
 * For DMF and GIOPF, regional breakup is shown only in
 * the deep-dive view.
 *
 * The numeric values are prototype/sample values.
 * They should be replaced with API data later.
 */

export const paymentData = [
  {
    key: "royalty",
    title: "Royalty Payment",
    rate: "15.00%",
    description: "15.00% of Average Sale Value",
    total: 18450000,

    type: "material",

    materials: {
      rom: {
        stock: 8450,
        amount: 6420000,
      },
      lumps: {
        stock: 18200,
        amount: 7840000,
      },
      fines: {
        stock: 11600,
        amount: 4190000,
      },
    },
  },

  {
    key: "dmf",
    title: "DMF",
    rate: "10.00%",
    description: "10.00% of Royalty Payment",
    total: 1845000,

    type: "regional",

    regions: [
      {
        key: "north",
        name: "North",
        total: 1120000,

        materials: {
          rom: {
            stock: 4800,
            amount: 390000,
          },
          lumps: {
            stock: 10800,
            amount: 475000,
          },
          fines: {
            stock: 7100,
            amount: 255000,
          },
        },
      },

      {
        key: "south",
        name: "South",
        total: 725000,

        materials: {
          rom: {
            stock: 3650,
            amount: 252000,
          },
          lumps: {
            stock: 7400,
            amount: 309000,
          },
          fines: {
            stock: 4500,
            amount: 164000,
          },
        },
      },
    ],
  },

  {
    key: "giopf",
    title: "GIOPF",
    rate: "10.00%",
    description: "10.00% of Average Sale Value",
    total: 1845000,

    type: "regional",

    regions: [
      {
        key: "north",
        name: "North",
        total: 1085000,

        materials: {
          rom: {
            stock: 4550,
            amount: 375000,
          },
          lumps: {
            stock: 10200,
            amount: 450000,
          },
          fines: {
            stock: 6800,
            amount: 260000,
          },
        },
      },

      {
        key: "south",
        name: "South",
        total: 760000,

        materials: {
          rom: {
            stock: 3900,
            amount: 275000,
          },
          lumps: {
            stock: 8000,
            amount: 325000,
          },
          fines: {
            stock: 4800,
            amount: 160000,
          },
        },
      },
    ],
  },

  {
    key: "nmet",
    title: "NMET",
    rate: "3.00%",
    description: "3.00% of Royalty Payment",
    total: 553500,

    type: "material",

    materials: {
      rom: {
        stock: 8450,
        amount: 192600,
      },
      lumps: {
        stock: 18200,
        amount: 235200,
      },
      fines: {
        stock: 11600,
        amount: 125700,
      },
    },
  },

  {
    key: "auctionPremium",
    title: "Auction Premium",
    rate: "63.55%",
    description: "63.55% of Average Sale Value",
    total: 7823475,

    type: "material",

    materials: {
      rom: {
        stock: 8450,
        amount: 2724000,
      },
      lumps: {
        stock: 18200,
        amount: 3346000,
      },
      fines: {
        stock: 11600,
        amount: 1759475,
      },
    },
  },
];

// Amounts in ₹ Cr (₹ L below one crore), as in the Overview.
const formatCurrency = formatRupeesShort;

const formatMT = (value) => {
  return `${value.toLocaleString("en-IN")} MT`;
};

/**
 * Payment heads for the chosen period (sample: yesterday's figures scaled by
 * the daily pattern; the API should return period totals directly).
 */
export function paymentsForPeriod(period) {
  const factor = rangeFactor("payment", period.fromDaysAgo, period.toDaysAgo);
  const scale = (value) => Math.round(value * factor);
  const scaleMaterials = (materials) =>
    Object.fromEntries(
      Object.entries(materials).map(([key, item]) => [key, { ...item, stock: scale(item.stock), amount: scale(item.amount) }])
    );

  return paymentData.map((payment) =>
    payment.type === "regional"
      ? {
          ...payment,
          total: scale(payment.total),
          regions: payment.regions.map((region) => ({
            ...region,
            total: scale(region.total),
            materials: scaleMaterials(region.materials),
          })),
        }
      : { ...payment, total: scale(payment.total), materials: scaleMaterials(payment.materials) }
  );
}

function PaymentSummary() {
  const periodControl = useSectionPeriod("fy");
  const { period } = periodControl;
  const payments = paymentsForPeriod(period);
  const [selectedKey, setSelectedKey] = useState(null);
  const selectedPayment = payments.find((payment) => payment.key === selectedKey) ?? null;

  const openDetails = (payment) => {
    setSelectedKey(payment.key);
  };

  const closeDetails = () => {
    setSelectedKey(null);
  };

  const collapse = useCollapsible(false);

  return (
    <section className={`payment-summary dash-panel${collapse.open ? "" : " collapsed"}`}>
      {/* =================================
          SECTION HEADER
      ================================= */}

      <div className="payment-summary-header section-head-period panel-head">
        <div>
          <h2>Payment Summary</h2>

          <p>Payment heads and corresponding payments</p>
        </div>
        <div className="panel-head-actions">
          <SectionPeriodChip control={periodControl} />
          <PartyTag />
          <SectionPeriodFilter control={periodControl} label="Payment period" />
          <CollapseButton collapse={collapse} label="Payment Summary" />
        </div>
      </div>

      {collapse.open && (
        <>

      {/* =================================
          PAYMENT CARDS
      ================================= */}

      <div className="payment-summary-grid">
        {payments.map((payment) => (
          <PaymentCard
            key={payment.key}
            payment={payment}
            onClick={() => openDetails(payment)}
          />
        ))}
      </div>

      {/* =================================
          DEEP DIVE
      ================================= */}

      <PaymentSummaryCharts payments={payments} />

      {selectedPayment && (
        <PaymentDetail
          payment={selectedPayment}
          period={period}
          periodText={`${period.title} · ${period.range}`}
          onClose={closeDetails}
        />
      )}
        </>
      )}
    </section>
  );
}

/* =========================================
   MAIN PAYMENT CARD
========================================= */

function PaymentCard({ payment, onClick }) {
  return (
    <button type="button" className="payment-card" onClick={onClick}>
      <div className="payment-card-top">
        <span className="payment-card-title">{payment.title}</span>

        <span className="payment-open-icon">↗</span>
      </div>

      <div className="payment-card-amount">{formatCurrency(payment.total)}</div>

      <div className="payment-card-rate">{payment.rate}</div>

      <div className="payment-card-description">{payment.description}</div>
    </button>
  );
}

/* =========================================
   PAYMENT DETAIL
========================================= */

function PaymentDetail({ payment, period, periodText, onClose }) {
  return (
    <DetailDrawer
      open
      onClose={onClose}
      eyebrow="Payment Details"
      title={payment.title}
      description={`${payment.description} · ${periodText}`}
    >
      <div className="payment-detail-panel">
        {/* Total Payment */}

        <div className="payment-detail-total">
          <div>
            <span>Total Payment</span>

            <strong>{formatCurrency(payment.total)}</strong>
          </div>

          <span className="payment-rate-badge">{payment.rate}</span>
        </div>

        <PaymentDailyChart paymentKey={payment.key} period={period} />

        {/* =================================
            REGIONAL PAYMENT
        ================================= */}

        {payment.type === "regional" && (
          <div className="payment-region-section">
            <div className="payment-detail-heading">
              <h4>Regional Payment</h4>

              <p>Payment distribution by region</p>
            </div>

            <div className="payment-region-grid">
              {payment.regions.map((region) => (
                <RegionPaymentCard key={region.key} region={region} />
              ))}
            </div>
          </div>
        )}

        {/* =================================
            DIRECT MATERIAL PAYMENT
        ================================= */}

        {payment.type === "material" && (
          <MaterialPaymentSection materials={payment.materials} />
        )}
      </div>
    </DetailDrawer>
  );
}

/* =========================================
   REGION PAYMENT CARD
========================================= */

function RegionPaymentCard({ region }) {
  return (
    <div className="payment-region-card">
      <div className="payment-region-header">
        <div>
          <span className="region-eyebrow">Region</span>

          <h5>{region.name}</h5>
        </div>

        <span className="region-total">{formatCurrency(region.total)}</span>
      </div>

      <div className="region-material-list">
        <RegionMaterialRow
          title="ROM"
          stock={region.materials.rom.stock}
          amount={region.materials.rom.amount}
        />

        <RegionMaterialRow
          title="Lumps"
          stock={region.materials.lumps.stock}
          amount={region.materials.lumps.amount}
        />

        <RegionMaterialRow
          title="Fines"
          stock={region.materials.fines.stock}
          amount={region.materials.fines.amount}
        />
      </div>
    </div>
  );
}

/* =========================================
   REGION MATERIAL ROW
========================================= */

function RegionMaterialRow({ title, stock, amount }) {
  return (
    <div className="region-material-row">
      <div>
        <span className="region-material-name">{title}</span>

        <span className="region-material-stock">{formatMT(stock)}</span>
      </div>

      <strong>{formatCurrency(amount)}</strong>
    </div>
  );
}

/* =========================================
   MATERIAL PAYMENT SECTION
========================================= */

function MaterialPaymentSection({ materials }) {
  return (
    <div className="payment-material-section">
      <div className="payment-detail-heading">
        <h4>Payment Against Stock</h4>

        <p>Stock quantity and payment amount by material type</p>
      </div>

      <div className="payment-material-grid">
        <PaymentMaterialCard
          title="ROM"
          stock={materials.rom.stock}
          amount={materials.rom.amount}
        />

        <PaymentMaterialCard
          title="Lumps"
          stock={materials.lumps.stock}
          amount={materials.lumps.amount}
        />

        <PaymentMaterialCard
          title="Fines"
          stock={materials.fines.stock}
          amount={materials.fines.amount}
        />
      </div>
    </div>
  );
}

/* =========================================
   MATERIAL PAYMENT CARD
========================================= */

function PaymentMaterialCard({ title, stock, amount }) {
  return (
    <div className="payment-material-card">
      <div className="payment-material-card-header">
        <span>{title}</span>
      </div>

      <div className="payment-material-stock">
        <span>Stock Paid For</span>

        <strong>{formatMT(stock)}</strong>
      </div>

      <div className="payment-material-amount">
        <span>Payment Amount</span>

        <strong>{formatCurrency(amount)}</strong>
      </div>
    </div>
  );
}

export default PaymentSummary;

/* =========================================
   DAILY CHART IN THE DRAWER
========================================= */

// The drawer chart never shows more than this many days.
const MAX_DRAWER_DAYS = 15;

/**
 * Daily amount for one payment head, ending on the period's last day:
 * 7 days for a single day, otherwise the period, at most 15 days.
 */
function PaymentDailyChart({ paymentKey, period }) {
  const base = paymentData.find((item) => item.key === paymentKey).total;
  const days = period.days === 1 ? 7 : Math.min(period.days, MAX_DRAWER_DAYS);
  const series = dailyValues("payment", base, period.toDaysAgo + days - 1, period.toDaysAgo).map((day) => ({
    day: dayLabel(period.dateOf(day.daysAgo)).slice(0, 6),
    amount: day.value,
    inPeriod: day.daysAgo <= period.fromDaysAgo,
  }));
  const capped = period.days > MAX_DRAWER_DAYS;

  return (
    <div className="payment-daily">
      <ChartCard
        title={`Daily amount · last ${days} days`}
        subtitle={capped ? `Showing the last ${MAX_DRAWER_DAYS} days of the period` : "Days in the selected period are highlighted"}
        height={200}
      >
        <BarChart data={series} margin={{ top: 8, right: 8, left: 6, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f1f3f5" />
          <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e5e9" }} interval="preserveStartEnd" minTickGap={8} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatRupeesShort} width={72} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatRupeesShort(value), "Amount"]} cursor={{ fill: "#fff5f5" }} />
          <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {series.map((day) => (
              <Cell key={day.day} fill={day.inPeriod ? CHART_COLORS.primary : "#ffc9cc"} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>
    </div>
  );
}
