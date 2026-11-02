import React, { useState } from "react";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import PeriodChip from "../common/PeriodChip/PeriodChip";
import "./OreProcessing.css";
import OreProcessingCharts from "./OreProcessingCharts";

/*
 * Processing data is intentionally kept data-driven.
 *
 * The backend can later return any number of grade bands.
 * We should not assume that a material has only one grade.
 */

export const processingData = {
  eauction: {
    key: "eauction",
    title: "eAuction",
    total: 28500,

    rom: 4500,

    lumps: {
      total: 14000,
      grades: [
        { range: "41–45%", quantity: 1800 },
        { range: "45–51%", quantity: 2900 },
        { range: "51–55%", quantity: 3900 },
        { range: "55–59%", quantity: 3100 },
        { range: "59–65%", quantity: 2300 },
      ],
    },

    fines: {
      total: 10000,
      grades: [
        { range: "41–45%", quantity: 1400 },
        { range: "45–51%", quantity: 2100 },
        { range: "51–55%", quantity: 2600 },
        { range: "55–59%", quantity: 2100 },
        { range: "59–65%", quantity: 1800 },
      ],
    },
  },

  royaltyPrimary: {
    key: "royaltyPrimary",
    title: "Royalty Paid",
    total: 32400,
    flag: "PRIMARY",

    rom: 5200,

    lumps: {
      total: 17600,
      grades: [
        { range: "41–45%", quantity: 2100 },
        { range: "45–51%", quantity: 3500 },
        { range: "51–55%", quantity: 4700 },
        { range: "55–59%", quantity: 4100 },
        { range: "59–65%", quantity: 3200 },
      ],
    },

    fines: {
      total: 9600,
      grades: [
        { range: "41–45%", quantity: 1300 },
        { range: "45–51%", quantity: 2000 },
        { range: "51–55%", quantity: 2500 },
        { range: "55–59%", quantity: 2100 },
        { range: "59–65%", quantity: 1700 },
      ],
    },
  },

  royaltySecondary: {
    key: "royaltySecondary",
    title: "Royalty Paid",
    total: 18700,
    flag: "NON PRIMARY",

    rom: 3100,

    lumps: {
      total: 10200,
      grades: [
        { range: "41–45%", quantity: 1200 },
        { range: "45–51%", quantity: 2100 },
        { range: "51–55%", quantity: 2700 },
        { range: "55–59%", quantity: 2300 },
        { range: "59–65%", quantity: 1900 },
      ],
    },

    fines: {
      total: 5400,
      grades: [
        { range: "41–45%", quantity: 800 },
        { range: "45–51%", quantity: 1100 },
        { range: "51–55%", quantity: 1400 },
        { range: "55–59%", quantity: 1200 },
        { range: "59–65%", quantity: 900 },
      ],
    },
  },
};

const formatMT = (value) => {
  return `${value.toLocaleString("en-IN")} MT`;
};

function OreProcessing() {
  const [selectedSource, setSelectedSource] = useState(null);

  /*
   * Total Processed is view-only.
   *
   * It is deliberately NOT clickable.
   */
  const totalProcessed =
    processingData.eauction.total +
    processingData.royaltyPrimary.total +
    processingData.royaltySecondary.total;

  const openDetails = (source) => {
    setSelectedSource(source);
  };

  const closeDetails = () => {
    setSelectedSource(null);
  };

  return (
    <section className="ore-processing">
      {/* =========================
          SECTION HEADER
      ========================= */}

      <div className="ore-processing-header">
        <div>
          <h2>Ore Processing</h2>
          <p>Processed stock by source and material type</p>
          <PeriodChip />
        </div>
      </div>

      {/* =========================
          FOUR MAIN CARDS
      ========================= */}

      <div className="ore-processing-grid">
        {/* ---------------------------------
            CARD 1 — TOTAL PROCESSED
            VIEW ONLY
        --------------------------------- */}

        <div className="processing-card total-processed-card">
          <div className="processing-card-top">
            <span className="processing-card-label">Total Processed</span>

            <span className="processing-view-only">View Only</span>
          </div>

          <div className="processing-total-value">
            {formatMT(totalProcessed)}
          </div>

          <div className="processing-card-description">
            eAuction + Royalty Paid
          </div>
        </div>

        {/* ---------------------------------
            CARD 2 — eAUCTION
        --------------------------------- */}
        {/* //Comment out if they don't need the deep detail one */}
        <div className="processing-card eauction-card">
          <ProcessingCardHeader
            title="eAuction"
            onClick={() => openDetails(processingData.eauction)}
          />

          <div className="processing-card-total">
            {formatMT(processingData.eauction.total)}
          </div>

          <div className="processing-material-list">
            <MaterialRow label="ROM" quantity={processingData.eauction.rom} />

            <MaterialRow
              label="Lumps"
              quantity={processingData.eauction.lumps.total}
              grades={processingData.eauction.lumps.grades.length}
            />

            <MaterialRow
              label="Fines"
              quantity={processingData.eauction.fines.total}
              grades={processingData.eauction.fines.grades.length}
            />
          </div>
        </div>

        {/* Remove the comment if they need the short detail one */}

        {/* <div className="processing-card eauction-card">
          <ProcessingCardHeader
            title="eAuction"
            onClick={() => openDetails(processingData.eauction)}
          />

          <div className="processing-card-total">
            {formatMT(processingData.eauction.total)}
          </div>

          <div className="processing-card-description">Processed stock</div>
        </div> */}

        {/* ---------------------------------
            CARD 3 — ROYALTY PRIMARY
        --------------------------------- */}

        <RoyaltyProcessingCard
          source={processingData.royaltyPrimary}
          onClick={() => openDetails(processingData.royaltyPrimary)}
        />

        {/* ---------------------------------
            CARD 4 — ROYALTY SECONDARY
        --------------------------------- */}

        <RoyaltyProcessingCard
          source={processingData.royaltySecondary}
          onClick={() => openDetails(processingData.royaltySecondary)}
        />
      </div>

      {/* =========================
          DETAIL VIEW
      ========================= */}

      <OreProcessingCharts />

      {selectedSource && (
        <ProcessingDetailView source={selectedSource} onClose={closeDetails} />
      )}
    </section>
  );
}

/* =========================================
   PROCESSING CARD HEADER
========================================= */

function ProcessingCardHeader({ title, onClick }) {
  return (
    <div className="processing-card-top">
      <span className="processing-card-label">{title}</span>

      <button
        type="button"
        className="processing-open-button"
        onClick={onClick}
        aria-label={`Open ${title} details`}
      >
        ↗
      </button>
    </div>
  );
}

/* =========================================
   ROYALTY CARD
========================================= */

function RoyaltyProcessingCard({ source, onClick }) {
  return (
    <div className="processing-card royalty-processing-card">
      <div className="royalty-card-top">
        <span className="processing-card-label">{source.title}</span>

        <div className="royalty-card-actions">
          <span
            className={`processing-flag ${
              source.flag === "PRIMARY" ? "primary-flag" : "secondary-flag"
            }`}
          >
            {source.flag}
          </span>

          <button
            type="button"
            className="processing-open-button"
            onClick={onClick}
            aria-label={`Open ${source.flag} royalty details`}
          >
            ↗
          </button>
        </div>
      </div>

      <div className="processing-card-total">{formatMT(source.total)}</div>

      <div className="processing-material-list">
        <MaterialRow label="ROM" quantity={source.rom} />

        <MaterialRow
          label="Lumps"
          quantity={source.lumps.total}
          grades={source.lumps.grades.length}
        />

        <MaterialRow
          label="Fines"
          quantity={source.fines.total}
          grades={source.fines.grades.length}
        />
      </div>
    </div>
  );
}

/* =========================================
   MATERIAL ROW
========================================= */

function MaterialRow({ label, quantity, grades }) {
  return (
    <div className="material-row">
      <div className="material-row-left">
        <span className="material-row-label">{label}</span>

        {grades && (
          <span className="material-grade-count">{grades} grades</span>
        )}
      </div>

      <span className="material-row-value">{formatMT(quantity)}</span>
    </div>
  );
}

/* =========================================
   DETAIL VIEW
========================================= */

function ProcessingDetailView({ source, onClose }) {
  return (
    <DetailDrawer
      open
      onClose={onClose}
      eyebrow="Ore Processing"
      title={`${source.title}${source.flag ? ` — ${source.flag}` : ""}`}
      description="Detailed processed stock composition"
    >
      <div className="processing-detail-panel">
        {/* Material Summary */}

        <div className="processing-material-summary">
          <ProcessingMaterialCard
            title="ROM"
            quantity={source.rom}
            description="No grade applicable"
          />

          <ProcessingMaterialCard
            title="Lumps"
            quantity={source.lumps.total}
            description={`${source.lumps.grades.length} grade bands`}
          />

          <ProcessingMaterialCard
            title="Fines"
            quantity={source.fines.total}
            description={`${source.fines.grades.length} grade bands`}
          />
        </div>

        {/* Grade Distribution */}

        <div className="processing-grade-section">
          <div className="processing-grade-heading">
            <div>
              <h4>Grade Distribution</h4>

              <p>Processed quantity by grade range</p>
            </div>
          </div>

          <div className="processing-grade-grid">
            <GradeDistribution
              title="Lumps"
              total={source.lumps.total}
              grades={source.lumps.grades}
            />

            <GradeDistribution
              title="Fines"
              total={source.fines.total}
              grades={source.fines.grades}
            />
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}

/* =========================================
   PROCESSING MATERIAL CARD
========================================= */

function ProcessingMaterialCard({ title, quantity, description }) {
  return (
    <div className="processing-material-card">
      <span className="processing-material-name">{title}</span>

      <strong>{formatMT(quantity)}</strong>

      <span className="processing-material-description">{description}</span>
    </div>
  );
}

/* =========================================
   GRADE DISTRIBUTION
========================================= */

function GradeDistribution({ title, total, grades }) {
  return (
    <div className="processing-grade-card">
      <div className="processing-grade-card-header">
        <div>
          <h5>{title}</h5>

          <span>{formatMT(total)}</span>
        </div>
      </div>

      <div className="processing-grade-chart" aria-label={`${title} quantity by grade`}>
        <div className="grade-chart-y-label">Quantity (MT)</div>

        <div className="processing-grade-columns">
          {grades.map((grade) => {
            const maxQuantity = Math.max(...grades.map((item) => item.quantity), 1);
            const height = Math.max((grade.quantity / maxQuantity) * 100, 4);
            const percentage = total > 0 ? (grade.quantity / total) * 100 : 0;

            return (
              <div
                className="processing-grade-column"
                key={`${title}-${grade.range}`}
              >
                <div className="processing-grade-quantity">
                  {formatMT(grade.quantity)}
                </div>

                <div className="processing-grade-bar-area">
                  <div
                    className="processing-grade-column-bar"
                    style={{ height: `${height}%` }}
                    title={`${grade.range}: ${formatMT(grade.quantity)} (${percentage.toFixed(1)}%)`}
                  />
                </div>

                <span className="processing-grade-range">{grade.range}</span>
                <span className="processing-grade-share">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OreProcessing;

// import React, { useMemo, useState } from "react";
// import { useDashboard } from "../../context/DashboardContext";
// import "./OreProcessing.css";

// const processingData = {
//   ALL: {
//     eauction: {
//       total: 4200,
//       rom: 1200,
//       lumps: 1800,
//       fines: 1200,
//       grades: [
//         { label: "41–45%", quantity: 520 },
//         { label: "45–51%", quantity: 860 },
//         { label: "51–55%", quantity: 640 },
//         { label: "55–59%", quantity: 480 },
//         { label: "59–65%", quantity: 500 },
//       ],
//     },

//     primary: {
//       total: 5200,
//       rom: 1600,
//       lumps: 2200,
//       fines: 1400,
//       grades: [
//         { label: "41–45%", quantity: 620 },
//         { label: "45–51%", quantity: 980 },
//         { label: "51–55%", quantity: 760 },
//         { label: "55–59%", quantity: 520 },
//         { label: "59–65%", quantity: 720 },
//       ],
//     },

//     secondary: {
//       total: 3050,
//       rom: 900,
//       lumps: 1250,
//       fines: 900,
//       grades: [
//         { label: "41–45%", quantity: 340 },
//         { label: "45–51%", quantity: 520 },
//         { label: "51–55%", quantity: 410 },
//         { label: "55–59%", quantity: 290 },
//         { label: "59–65%", quantity: 360 },
//       ],
//     },
//   },

//   CURRENT_PARTY: {
//     eauction: {
//       total: 720,
//       rom: 200,
//       lumps: 310,
//       fines: 210,
//       grades: [
//         { label: "41–45%", quantity: 80 },
//         { label: "45–51%", quantity: 140 },
//         { label: "51–55%", quantity: 110 },
//         { label: "55–59%", quantity: 70 },
//         { label: "59–65%", quantity: 120 },
//       ],
//     },

//     primary: {
//       total: 940,
//       rom: 280,
//       lumps: 390,
//       fines: 270,
//       grades: [
//         { label: "41–45%", quantity: 100 },
//         { label: "45–51%", quantity: 170 },
//         { label: "51–55%", quantity: 130 },
//         { label: "55–59%", quantity: 90 },
//         { label: "59–65%", quantity: 120 },
//       ],
//     },

//     secondary: {
//       total: 510,
//       rom: 150,
//       lumps: 210,
//       fines: 150,
//       grades: [
//         { label: "41–45%", quantity: 50 },
//         { label: "45–51%", quantity: 80 },
//         { label: "51–55%", quantity: 70 },
//         { label: "55–59%", quantity: 45 },
//         { label: "59–65%", quantity: 55 },
//       ],
//     },
//   },

//   "ABC Mining Pvt Ltd": {
//     eauction: {
//       total: 1050,
//       rom: 300,
//       lumps: 450,
//       fines: 300,
//       grades: [
//         { label: "41–45%", quantity: 120 },
//         { label: "45–51%", quantity: 210 },
//         { label: "51–55%", quantity: 160 },
//         { label: "55–59%", quantity: 110 },
//         { label: "59–65%", quantity: 130 },
//       ],
//     },

//     primary: {
//       total: 1320,
//       rom: 400,
//       lumps: 550,
//       fines: 370,
//       grades: [
//         { label: "41–45%", quantity: 140 },
//         { label: "45–51%", quantity: 240 },
//         { label: "51–55%", quantity: 180 },
//         { label: "55–59%", quantity: 120 },
//         { label: "59–65%", quantity: 150 },
//       ],
//     },

//     secondary: {
//       total: 680,
//       rom: 190,
//       lumps: 280,
//       fines: 210,
//       grades: [
//         { label: "41–45%", quantity: 70 },
//         { label: "45–51%", quantity: 120 },
//         { label: "51–55%", quantity: 90 },
//         { label: "55–59%", quantity: 60 },
//         { label: "59–65%", quantity: 80 },
//       ],
//     },
//   },
// };

// const emptyProcessing = {
//   eauction: {
//     total: 0,
//     rom: 0,
//     lumps: 0,
//     fines: 0,
//     grades: [],
//   },
//   primary: {
//     total: 0,
//     rom: 0,
//     lumps: 0,
//     fines: 0,
//     grades: [],
//   },
//   secondary: {
//     total: 0,
//     rom: 0,
//     lumps: 0,
//     fines: 0,
//     grades: [],
//   },
// };

// function OreProcessing() {
//   const { filters, isParty } = useDashboard();

//   const [selectedType, setSelectedType] = useState(null);

//   const dataKey = isParty ? "CURRENT_PARTY" : filters.organisation;

//   const currentProcessing = useMemo(() => {
//     return processingData[dataKey] || emptyProcessing;
//   }, [dataKey]);

//   const totalProcessed =
//     currentProcessing.eauction.total +
//     currentProcessing.primary.total +
//     currentProcessing.secondary.total;

//   const cards = [
//     {
//       id: "total",
//       title: "Total Processed",
//       value: totalProcessed,
//       type: "total",
//       clickable: false,
//     },
//     {
//       id: "eauction",
//       title: "eAuction",
//       value: currentProcessing.eauction.total,
//       type: "eauction",
//       clickable: true,
//     },
//     {
//       id: "primary",
//       title: "Royalty Paid",
//       flag: "PRIMARY",
//       value: currentProcessing.primary.total,
//       type: "primary",
//       clickable: true,
//     },
//     {
//       id: "secondary",
//       title: "Royalty Paid",
//       flag: "SECONDARY",
//       value: currentProcessing.secondary.total,
//       type: "secondary",
//       clickable: true,
//     },
//   ];

//   const selectedData = selectedType && currentProcessing[selectedType];

//   const selectedTitle =
//     selectedType === "eauction"
//       ? "eAuction"
//       : selectedType === "primary"
//       ? "Royalty Paid — Primary"
//       : "Royalty Paid — Secondary";

//   const getGradePercentage = (quantity) => {
//     if (!selectedData) return 0;

//     const totalGradeStock = selectedData.lumps + selectedData.fines;

//     if (!totalGradeStock) return 0;

//     return (quantity / totalGradeStock) * 100;
//   };

//   return (
//     <section className="processing-section">
//       <div className="section-header">
//         <div>
//           <h2>Ore Processing</h2>

//           <p>
//             {isParty
//               ? "Processing activity for your organisation"
//               : filters.organisation === "ALL"
//               ? "Statewide processing activity"
//               : `Processing activity for ${filters.organisation}`}
//           </p>
//         </div>
//       </div>

//       <div className="processing-grid">
//         {cards.map((card) => (
//           <div
//             key={card.id}
//             className={`processing-card ${
//               card.clickable ? "processing-card-clickable" : ""
//             }`}
//             onClick={() => {
//               if (card.clickable) {
//                 setSelectedType(card.type);
//               }
//             }}
//           >
//             <div className="processing-card-content">
//               <div className="processing-card-title-row">
//                 <span className="processing-card-title">{card.title}</span>

//                 {card.flag && (
//                   <span
//                     className={`processing-flag ${
//                       card.flag === "PRIMARY"
//                         ? "processing-flag-primary"
//                         : "processing-flag-secondary"
//                     }`}
//                   >
//                     {card.flag}
//                   </span>
//                 )}
//               </div>

//               <span className="processing-card-value">
//                 {card.value.toLocaleString()} MT
//               </span>

//               <span className="processing-card-label">Processed Stock</span>
//             </div>

//             {card.clickable && (
//               <button
//                 className="processing-arrow"
//                 onClick={(event) => {
//                   event.stopPropagation();
//                   setSelectedType(card.type);
//                 }}
//                 aria-label={`View ${selectedTitle} details`}
//               >
//                 ↗
//               </button>
//             )}
//           </div>
//         ))}
//       </div>

//       {selectedData && (
//         <div
//           className="processing-modal-overlay"
//           onClick={() => setSelectedType(null)}
//         >
//           <div
//             className="processing-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="processing-modal-header">
//               <div>
//                 <span className="processing-modal-eyebrow">
//                   Processing Details
//                 </span>

//                 <h3>{selectedTitle}</h3>

//                 <p>
//                   {isParty
//                     ? "Your organisation"
//                     : filters.organisation === "ALL"
//                     ? "All organisations"
//                     : filters.organisation}
//                 </p>
//               </div>

//               <button
//                 className="processing-modal-close"
//                 onClick={() => setSelectedType(null)}
//                 aria-label="Close"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="processing-modal-body">
//               <div className="processing-material-grid">
//                 <div className="processing-material-card">
//                   <span>ROM</span>

//                   <strong>{selectedData.rom.toLocaleString()} MT</strong>
//                 </div>

//                 <div className="processing-material-card">
//                   <span>Lumps</span>

//                   <strong>{selectedData.lumps.toLocaleString()} MT</strong>
//                 </div>

//                 <div className="processing-material-card">
//                   <span>Fines</span>

//                   <strong>{selectedData.fines.toLocaleString()} MT</strong>
//                 </div>
//               </div>

//               {selectedData.grades.length > 0 && (
//                 <div className="processing-grade-section">
//                   <div className="processing-detail-heading">
//                     <div>
//                       <h4>Lumps / Fines Grade Distribution</h4>

//                       <span>Dynamic grade distribution</span>
//                     </div>
//                   </div>

//                   {selectedData.grades.map((grade) => {
//                     const percentage = getGradePercentage(grade.quantity);

//                     return (
//                       <div className="processing-grade-row" key={grade.label}>
//                         <div className="processing-grade-top">
//                           <span>{grade.label}</span>

//                           <div>
//                             <strong>
//                               {grade.quantity.toLocaleString()} MT
//                             </strong>

//                             <small>{percentage.toFixed(1)}%</small>
//                           </div>
//                         </div>

//                         <div className="processing-grade-progress">
//                           <div
//                             className="processing-grade-progress-fill"
//                             style={{
//                               width: `${Math.min(percentage, 100)}%`,
//                             }}
//                           />
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }

// export default OreProcessing;
