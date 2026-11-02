import React, { useMemo, useState } from "react";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import "./StockSummary.css";

const stockData = {
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

const formatMT = (value) => {
  return `${value.toLocaleString("en-IN")} MT`;
};

function StockSummary() {
  const [selectedSource, setSelectedSource] = useState(null);
  const [stockView, setStockView] = useState("total");

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

  return (
    <section className="stock-summary">
      {/* Section Header */}
      <div className="stock-summary-header">
        <div>
          <h2>Stock Summary</h2>
          <p>Current stock across registered sources</p>
        </div>
      </div>

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
      </div>

      {/* =========================
          DETAIL VIEW
      ========================= */}

      {selectedSource && (
        <StockDetailView
          source={selectedSource}
          stockView={stockView}
          setStockView={setStockView}
          onClose={closeDetails}
        />
      )}
    </section>
  );
}

/* =========================================
   SOURCE CARD
========================================= */

function StockSourceCard({ source, onClick }) {
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

      <div className="stock-card-description">
        Click to view stock composition
      </div>
    </button>
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

function getStockByView(source, view) {
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
