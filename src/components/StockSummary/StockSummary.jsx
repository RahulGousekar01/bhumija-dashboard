import React, { useMemo, useState } from "react";
import CollapseButton, { useCollapsible } from "../common/SectionPanel/SectionPanel";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import PeriodChip, { PartyTag } from "../common/PeriodChip/PeriodChip";
import "./StockSummary.css";
import StockSummaryCharts from "./StockSummaryCharts";

export const stockData = {
  royalty: {
    key: "royalty",
    title: "Royalty",
    total: 58400,
    rom: 8400,

    lumps: {
      total: 32000,
      grades: [
        { range: "41–45%", quantity: 4200 },
        { range: "45–51%", quantity: 6800 },
        { range: "51–55%", quantity: 8400 },
        { range: "55–59%", quantity: 7200 },
        { range: "59–65%", quantity: 5400 },
      ],
    },

    fines: {
      total: 18000,
      grades: [
        { range: "41–45%", quantity: 2800 },
        { range: "45–51%", quantity: 3900 },
        { range: "51–55%", quantity: 4600 },
        { range: "55–59%", quantity: 3700 },
        { range: "59–65%", quantity: 3000 },
      ],
    },
  },

  eauction: {
    key: "eauction",
    title: "eAuction",
    total: 34200,
    rom: 5200,

    lumps: {
      total: 18800,
      grades: [
        { range: "41–45%", quantity: 2400 },
        { range: "45–51%", quantity: 3800 },
        { range: "51–55%", quantity: 5200 },
        { range: "55–59%", quantity: 4100 },
        { range: "59–65%", quantity: 3300 },
      ],
    },

    fines: {
      total: 10200,
      grades: [
        { range: "41–45%", quantity: 1500 },
        { range: "45–51%", quantity: 2200 },
        { range: "51–55%", quantity: 2700 },
        { range: "55–59%", quantity: 2100 },
        { range: "59–65%", quantity: 1700 },
      ],
    },
  },

  imported: {
    key: "imported",
    title: "Imported",
    total: 32800,
    rom: 4600,

    lumps: {
      total: 18200,
      grades: [
        { range: "41–45%", quantity: 2100 },
        { range: "45–51%", quantity: 3600 },
        { range: "51–55%", quantity: 4800 },
        { range: "55–59%", quantity: 4300 },
        { range: "59–65%", quantity: 3400 },
      ],
    },

    fines: {
      total: 10000,
      grades: [
        { range: "41–45%", quantity: 1300 },
        { range: "45–51%", quantity: 2100 },
        { range: "51–55%", quantity: 2600 },
        { range: "55–59%", quantity: 2200 },
        { range: "59–65%", quantity: 1800 },
      ],
    },
  },

};

/*
 * Dump stock (sample) by how the dump was given: eAuction or Allotted.
 * Balance = Total - Transported; it lies within or outside the geofence.
 */
export const dumpStockData = {
  eauction: {
    key: "eauction",
    title: "eAuction",
    total: 18400,
    processed: 9200,
    transported: 6100,
    geofence: { within: 9800, outside: 2500 },
  },
  allotted: {
    key: "allotted",
    title: "Allotted",
    total: 26600,
    processed: 14300,
    transported: 8900,
    geofence: { within: 14200, outside: 3500 },
  },
};

const formatMT = (value) => {
  return `${value.toLocaleString("en-IN")} MT`;
};

function StockSummary() {
  const [selectedSource, setSelectedSource] = useState(null);
  const [stockView, setStockView] = useState("total");
  const [dumpsOpen, setDumpsOpen] = useState(false);

  const totalDumps = Object.values(dumpStockData).reduce((total, dump) => total + dump.total, 0);

  /*
   * Total Stock is deliberately view-only.
   *
   * It is calculated from:
   * Royalty + eAuction + Imported
   */
  const totalStock = useMemo(() => {
    return Object.values(stockData).reduce(
      (total, source) => total + source.total,
      0
    );
  }, []);

  const openDetails = (source) => {
    setSelectedSource(source);
    setStockView("total");
  };

  const closeDetails = () => {
    setSelectedSource(null);
  };

  const collapse = useCollapsible(true);

  return (
    <section className={`stock-summary dash-panel${collapse.open ? "" : " collapsed"}`}>
      {/* Section Header */}
      <div className="stock-summary-header panel-head">
        <div>
          <h2>Stock Summary</h2>
          <p>Current stock across registered sources</p>
        </div>
        <div className="panel-head-actions">
          <PeriodChip />
          <PartyTag />
          <CollapseButton collapse={collapse} label="Stock Summary" />
        </div>
      </div>

      {collapse.open && (
        <>

      {/* =========================
          MAIN STOCK CARDS
      ========================= */}

      <div className="stock-summary-grid">
        {/* TOTAL STOCK - VIEW ONLY */}
        <div className="stock-card total-stock-card">
          <div className="stock-card-top">
            <span className="stock-card-label">Total Stock</span>

            <span className="view-only-label">View Only</span>
          </div>

          <div className="stock-card-value">{formatMT(totalStock)}</div>

          <div className="stock-card-description">
            Royalty + eAuction + Imported
          </div>
        </div>

        {/* ROYALTY */}
        <StockSourceCard
          source={stockData.royalty}
          onClick={() => openDetails(stockData.royalty)}
        />

        {/* eAUCTION */}
        <StockSourceCard
          source={stockData.eauction}
          onClick={() => openDetails(stockData.eauction)}
        />

        {/* IMPORTED */}
        <StockSourceCard
          source={stockData.imported}
          onClick={() => openDetails(stockData.imported)}
        />

        {/* DUMPS */}
        <StockSourceCard
          source={{ title: "Dumps", total: totalDumps }}
          description="eAuction + Allotted dumps"
          onClick={() => setDumpsOpen(true)}
        />
      </div>

      {/* =========================
          DETAIL VIEW
      ========================= */}

      <StockSummaryCharts />

      {selectedSource && (
        <StockDetailView
          source={selectedSource}
          stockView={stockView}
          setStockView={setStockView}
          onClose={closeDetails}
        />
      )}

      {dumpsOpen && <DumpStockDetail onClose={() => setDumpsOpen(false)} />}
        </>
      )}
    </section>
  );
}

/* =========================================
   SOURCE CARD
========================================= */

function StockSourceCard({ source, onClick, description = "Click to view stock composition" }) {
  return (
    <button
      type="button"
      className="stock-card source-stock-card"
      onClick={onClick}
    >
      <div className="stock-card-top">
        <span className="stock-card-label">{source.title}</span>

        <span className="open-card-icon">↗</span>
      </div>

      <div className="stock-card-value">{formatMT(source.total)}</div>

      <div className="stock-card-description">{description}</div>
    </button>
  );
}

/* =========================================
   DUMPS DETAIL VIEW
========================================= */

function DumpStockDetail({ onClose }) {
  const [tab, setTab] = useState("eauction");
  const dump = dumpStockData[tab];
  const balance = dump.total - dump.transported;
  const geofenceTotal = dump.geofence.within + dump.geofence.outside;

  return (
    <DetailDrawer
      open
      onClose={onClose}
      eyebrow="Stock Details"
      title="Dumps Stock"
      description="Dump stock by how the dump was given, as of the end of yesterday"
    >
      <div className="stock-detail-panel">
        <div className="stock-view-controls">
          <div className="stock-view-switch" role="tablist" aria-label="Dump type">
            {Object.values(dumpStockData).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                className={`stock-view-button ${tab === item.key ? "active" : ""}`}
                onClick={() => setTab(item.key)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="material-summary-grid four">
          <MaterialSummaryCard title="Total" quantity={dump.total} description={`${dump.title} dumps`} />
          <MaterialSummaryCard title="Processed" quantity={dump.processed} description="Screened so far" />
          <MaterialSummaryCard title="Transported" quantity={dump.transported} description="Moved out" />
          <MaterialSummaryCard title="Balance" quantity={balance} description="Total − Transported" />
        </div>

        <div className="grade-section">
          <div className="grade-section-header">
            <div>
              <h4>Where the balance lies</h4>
              <p>Balance stock within and outside the geofence</p>
            </div>
          </div>

          <div className="geofence-grid">
            {[
              ["Within geofence", dump.geofence.within],
              ["Outside geofence", dump.geofence.outside],
            ].map(([label, quantity]) => {
              const share = Math.round((quantity / geofenceTotal) * 100);
              return (
                <div className="geofence-card" key={label}>
                  <span>{label}</span>
                  <strong>{formatMT(quantity)}</strong>
                  <div className="geofence-bar" aria-hidden="true">
                    <span style={{ width: `${share}%` }} />
                  </div>
                  <small>{share}% of balance</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}

/* =========================================
   DETAIL VIEW
========================================= */

function StockDetailView({ source, stockView, setStockView, onClose }) {
  const visibleStock = getStockByView(source, stockView);

  return (
    <DetailDrawer
      open
      onClose={onClose}
      eyebrow="Stock Details"
      title={`${source.title} Stock`}
      description="Material-wise and grade-wise stock distribution"
    >
      <div className="stock-detail-panel">
        {/* =========================
            TOTAL / TRANSPORTED / BALANCE
        ========================= */}

        <div className="stock-view-controls">
          <div className="stock-view-switch" role="group" aria-label="Stock view">
            {[["total", "Total"], ["transported", "Transported"], ["balance", "Balance"]].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`stock-view-button ${stockView === value ? "active" : ""}`}
                onClick={() => setStockView(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="stock-info-note">
            <span className="stock-info-icon" aria-hidden="true">i</span>
            <div>
              <strong>How to read this view</strong>
              <span>
                Total is the stock recorded under this source. Transported is
                dispatched stock, while Balance is what remains.
              </span>
            </div>
          </div>
        </div>

        {/* =========================
            SUMMARY
        ========================= */}

        <div className="material-summary-grid">
          <MaterialSummaryCard
            title="ROM"
            quantity={visibleStock.rom}
            description="No grade applicable"
          />

          <MaterialSummaryCard
            title="Lumps"
            quantity={visibleStock.lumps.total}
            description={`${visibleStock.lumps.grades.length} grade bands`}
          />

          <MaterialSummaryCard
            title="Fines"
            quantity={visibleStock.fines.total}
            description={`${visibleStock.fines.grades.length} grade bands`}
          />
        </div>

        {/* =========================
            GRADE DISTRIBUTION
        ========================= */}

        <div className="grade-section">
          <div className="grade-section-header">
            <div>
              <h4>Grade Distribution</h4>
              <p>Quantity and percentage within each material type</p>
            </div>
          </div>

          <div className="grade-distribution-grid">
            <GradeDistribution
              title="Lumps"
              total={visibleStock.lumps.total}
              grades={visibleStock.lumps.grades}
            />

            <GradeDistribution
              title="Fines"
              total={visibleStock.fines.total}
              grades={visibleStock.fines.grades}
            />
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}

/* =========================================
   MATERIAL SUMMARY CARD
========================================= */

function MaterialSummaryCard({ title, quantity, description }) {
  return (
    <div className="material-summary-card">
      <span className="material-name">{title}</span>

      <strong>{formatMT(quantity)}</strong>

      <span className="material-description">{description}</span>
    </div>
  );
}

/* =========================================
   GRADE DISTRIBUTION
========================================= */

function GradeDistribution({ title, total, grades }) {
  return (
    <div className="grade-distribution-card">
      <div className="grade-card-header">
        <div>
          <h5>{title}</h5>
          <span>{formatMT(total)}</span>
        </div>
      </div>

      <div className="grade-chart" aria-label={`${title} grade quantity distribution`}>
        {grades.map((grade) => {
          const percentage = total > 0 ? (grade.quantity / total) * 100 : 0;

          return (
            <div className="grade-chart-row" key={`${title}-${grade.range}`}>
              <div className="grade-chart-label">{grade.range}</div>

              <div className="grade-chart-track">
                <div
                  className="grade-chart-bar"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="grade-chart-value">
                <strong>{formatMT(grade.quantity)}</strong>
                <span>{percentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================
   VIEW CALCULATIONS
========================================= */

export function getStockByView(source, view) {
  if (view === "total") {
    return {
      rom: source.rom,
      lumps: source.lumps,
      fines: source.fines,
    };
  }

  /*
   * Temporary frontend sample calculations.
   *
   * When the API is connected, these values should come
   * directly from backend stock / transport data.
   */
  if (view === "transported") {
    return {
      rom: Math.round(source.rom * 0.28),

      lumps: {
        total: Math.round(source.lumps.total * 0.24),
        grades: source.lumps.grades.map((grade) => ({
          ...grade,
          quantity: Math.round(grade.quantity * 0.24),
        })),
      },

      fines: {
        total: Math.round(source.fines.total * 0.21),
        grades: source.fines.grades.map((grade) => ({
          ...grade,
          quantity: Math.round(grade.quantity * 0.21),
        })),
      },
    };
  }

  return {
    rom: Math.round(source.rom * 0.72),

    lumps: {
      total: Math.round(source.lumps.total * 0.76),
      grades: source.lumps.grades.map((grade) => ({
        ...grade,
        quantity: Math.round(grade.quantity * 0.76),
      })),
    },

    fines: {
      total: Math.round(source.fines.total * 0.79),
      grades: source.fines.grades.map((grade) => ({
        ...grade,
        quantity: Math.round(grade.quantity * 0.79),
      })),
    },
  };
}

export default StockSummary;
