import React, { useState } from "react";
import CollapseButton, { useCollapsible } from "../common/SectionPanel/SectionPanel";
import { useDashboard } from "../../context/DashboardContext";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import PeriodChip, { PartyTag } from "../common/PeriodChip/PeriodChip";
import "./DumpsSummary.css";
import DumpsSummaryCharts from "./DumpsSummaryCharts";

export const dumpData = {
  annualTotal: {
    allocation: [
      { party: "ABC Mining Pvt Ltd", allocated: 7200000 },
      { party: "XYZ Minerals", allocated: 5800000 },
      { party: "Goa Ore Industries", allocated: 4600000 },
      { party: "Konkan Minerals", allocated: 3400000 },
    ],
    eauction: [
      { party: "ABC Mining Pvt Ltd", allocated: 1800000 },
      { party: "XYZ Minerals", allocated: 1200000 },
      { party: "Goa Ore Industries", allocated: 700000 },
      { party: "Konkan Minerals", allocated: 300000 },
    ],
  },
  extracted: {
    total: 50000,
    parties: [
      { party: "ABC Mining Pvt Ltd", extracted: 22000, transported: 9000 },
      { party: "XYZ Minerals", extracted: 16000, transported: 6500 },
      { party: "Goa Ore Industries", extracted: 12000, transported: 4500 },
    ],
  },
  processed: {
    wet: {
      total: 40000,
      rom: 10000,
      fines: {
        total: 15000,
        grades: [
          { range: "41–45%", quantity: 2500 },
          { range: "45–51%", quantity: 3500 },
          { range: "51–55%", quantity: 4000 },
          { range: "55–59%", quantity: 3000 },
          { range: "59–65%", quantity: 2000 },
        ],
      },
      lumps: {
        total: 10000,
        grades: [
          { range: "41–45%", quantity: 1800 },
          { range: "45–51%", quantity: 2200 },
          { range: "51–55%", quantity: 2600 },
          { range: "55–59%", quantity: 1900 },
          { range: "59–65%", quantity: 1500 },
        ],
      },
      tailings: 5000,
    },
    dry: {
      total: 40000,
      rom: 10000,
      fines: {
        total: 15000,
        grades: [
          { range: "41–45%", quantity: 2300 },
          { range: "45–51%", quantity: 3300 },
          { range: "51–55%", quantity: 3700 },
          { range: "55–59%", quantity: 2800 },
          { range: "59–65%", quantity: 1900 },
        ],
      },
      lumps: {
        total: 15000,
        grades: [
          { range: "41–45%", quantity: 2100 },
          { range: "45–51%", quantity: 2600 },
          { range: "51–55%", quantity: 3000 },
          { range: "55–59%", quantity: 2400 },
          { range: "59–65%", quantity: 1900 },
        ],
      },
    },
  },
  waste: [
    { party: "ABC Mining Pvt Ltd", dump: "Dump A", allocated: 7200000, waste: 4200 },
    { party: "XYZ Minerals", dump: "Dump B", allocated: 5800000, waste: 3100 },
    { party: "Goa Ore Industries", dump: "Dump C", allocated: 4600000, waste: 1800 },
    { party: "Konkan Minerals", dump: "Dump D", allocated: 3400000, waste: 900 },
  ],
};

// Sample: dump material processed by each party (wet + dry screening).
export const partyProcessed = {
  "ABC Mining Pvt Ltd": { wet: 5200, dry: 4400 },
  "XYZ Minerals": { wet: 3900, dry: 3100 },
  "Goa Ore Industries": { wet: 2800, dry: 2300 },
  "Konkan Minerals": { wet: 1500, dry: 1200 },
};

// The logged-in party in this prototype.
export const OWN_PARTY = "ABC Mining Pvt Ltd";

const formatMT = (value) => `${value.toLocaleString("en-IN")} MT`;
const formatMillionMT = (value) => `${(value / 1000000).toFixed(1)} M MT`;

/**
 * The party whose dumps are shown: a Party user sees only its own; a Super
 * Admin sees everyone, or one party picked in the Organisation filter.
 */
export function useDumpScope() {
  const { isParty, filters } = useDashboard();
  if (isParty) return OWN_PARTY;
  return filters.organisation !== "ALL" ? filters.organisation : null;
}

function DumpsSummary() {
  const { isParty } = useDashboard();
  const scopeParty = useDumpScope();
  const [drawer, setDrawer] = useState(null);
  const [extractedView, setExtractedView] = useState("geofence");
  const [screening, setScreening] = useState("wet");

  const inScope = (row) => !scopeParty || row.party === scopeParty;

  const allocationRows = dumpData.annualTotal.allocation.filter(inScope);
  const eauctionRows = dumpData.annualTotal.eauction.filter(inScope);
  const annualSplit = {
    allocation: allocationRows.reduce((sum, row) => sum + row.allocated, 0),
    eauction: eauctionRows.reduce((sum, row) => sum + row.allocated, 0),
  };
  const totalAnnualDump = annualSplit.allocation + annualSplit.eauction;

  const scopedProcessed = scopeParty ? partyProcessed[scopeParty] ?? { wet: 0, dry: 0 } : null;
  const wet = { total: scopedProcessed ? scopedProcessed.wet : dumpData.processed.wet.total };
  const dry = { total: scopedProcessed ? scopedProcessed.dry : dumpData.processed.dry.total };

  const extractedRows = dumpData.extracted.parties.filter(inScope);
  const wasteRows = dumpData.waste.filter(inScope);
  const visibleExtracted = {
    extracted: extractedRows.reduce((sum, row) => sum + row.extracted, 0),
    transported: extractedRows.reduce((sum, row) => sum + row.transported, 0),
  };

  // Party users only view their figures; drawers with other parties' rows stay with the Super Admin.
  const viewOnly = isParty;

  const openDrawer = (type) => setDrawer(type);
  const closeDrawer = () => setDrawer(null);

  const collapse = useCollapsible(false);

  return (
    <section className={`dumps-summary-section dash-panel${collapse.open ? "" : " collapsed"}`}>
      <div className="section-header panel-head">
        <div>
          <h2>Dumps Summary</h2>
          <p>Dump allocation, extraction, processing and waste monitoring</p>
        </div>
        <div className="panel-head-actions">
          <PeriodChip />
          <PartyTag />
          <CollapseButton collapse={collapse} label="Dumps Summary" />
        </div>
      </div>

      {collapse.open && (
        <>

      <div className="dumps-summary-grid">
        <DumpCard
          title={isParty ? "Dump Allotted to You" : "Annual Total Dump"}
          value={formatMillionMT(totalAnnualDump)}
          rows={[
            { label: "Allocation", value: formatMillionMT(annualSplit.allocation) },
            { label: "eAuction", value: formatMillionMT(annualSplit.eauction) },
          ]}
          label={viewOnly ? "View only" : undefined}
          onClick={viewOnly ? undefined : () => openDrawer("annual")}
        />
        <DumpCard
          title="Extracted"
          value={formatMT(visibleExtracted.extracted)}
          rows={[
            {
              label: "Within GeoFence",
              value: formatMT(Math.max(visibleExtracted.extracted - visibleExtracted.transported, 0)),
            },
            { label: "Transported", value: formatMT(visibleExtracted.transported) },
          ]}
          label={viewOnly ? "View only" : undefined}
          onClick={viewOnly ? undefined : () => openDrawer("extracted")}
        />
        <DumpCard
          title="Processed"
          value={formatMT(wet.total + dry.total)}
          rows={[
            { label: "Wet Screening", value: formatMT(wet.total) },
            { label: "Dry Screening", value: formatMT(dry.total) },
          ]}
          label={viewOnly ? "View only" : undefined}
          // The grade-wise drawer covers all parties, so it opens only on the unfiltered view.
          onClick={viewOnly || scopeParty ? undefined : () => openDrawer("processed")}
        />
        <DumpCard
          title="Waste"
          value={formatMT(wasteRows.reduce((sum, row) => sum + row.waste, 0))}
          label={viewOnly ? "View only" : scopeParty ? "Waste generated" : "Party-wise waste"}
          onClick={viewOnly ? undefined : () => openDrawer("waste")}
        />
      </div>

      <DumpsSummaryCharts scopeParty={scopeParty} processed={wet.total + dry.total} />

      <DetailDrawer
        open={drawer === "annual"}
        onClose={closeDrawer}
        eyebrow="Dumps Summary"
        title="Annual Total Dump"
        description="Annual dump quantity split between allocation and eAuction."
      >
        <DumpAllocationTable title="Allocation" rows={allocationRows} />
        <DumpAllocationTable title="EAuction" rows={eauctionRows} />
      </DetailDrawer>

      <DetailDrawer
        open={drawer === "extracted"}
        onClose={closeDrawer}
        eyebrow="Dumps Summary"
        title="Extracted"
        description="Extraction and transportation status for the selected scope."
      >
        <div className="drawer-toggle-group" role="tablist" aria-label="Extraction view">
          <button className={extractedView === "geofence" ? "active" : ""} onClick={() => setExtractedView("geofence")}>Within GeoFence</button>
          <button className={extractedView === "transported" ? "active" : ""} onClick={() => setExtractedView("transported")}>Transported</button>
        </div>

        <div className="dump-summary-strip">
          <div><span>Total Extracted</span><strong>{formatMT(visibleExtracted.extracted)}</strong></div>
          <div><span>Transported</span><strong>{formatMT(visibleExtracted.transported)}</strong></div>
          <div><span>Balance</span><strong>{formatMT(Math.max(visibleExtracted.extracted - visibleExtracted.transported, 0))}</strong></div>
        </div>

        {extractedView === "geofence" ? (
          <div className="dump-table-wrap">
            <table className="dump-table">
              <thead><tr><th>Party</th><th>Extracted</th><th>Balance</th></tr></thead>
              <tbody>
                {extractedRows.map((row) => (
                  <tr key={row.party}>
                    <td>{row.party}</td><td>{formatMT(row.extracted)}</td><td>{formatMT(Math.max(row.extracted - row.transported, 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dump-table-wrap">
            <table className="dump-table">
              <thead><tr><th>Party</th><th>Transported</th></tr></thead>
              <tbody>
                {extractedRows.map((row) => <tr key={row.party}><td>{row.party}</td><td>{formatMT(row.transported)}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </DetailDrawer>

      <DetailDrawer
        open={drawer === "processed"}
        onClose={closeDrawer}
        eyebrow="Dumps Summary"
        title="Processed"
        description="Processing output separated by screening method."
      >
        <div className="drawer-toggle-group" role="tablist" aria-label="Screening type">
          <button className={screening === "wet" ? "active" : ""} onClick={() => setScreening("wet")}>Wet Screening</button>
          <button className={screening === "dry" ? "active" : ""} onClick={() => setScreening("dry")}>Dry Screening</button>
        </div>

        <div className="processed-total-banner">
          <span>Total</span><strong>{formatMT(dumpData.processed[screening].total)}</strong>
        </div>

        <ProcessedMaterial title="ROM" quantity={dumpData.processed[screening].rom} />
        <ProcessedMaterial title="Fines" quantity={dumpData.processed[screening].fines.total} grades={dumpData.processed[screening].fines.grades} />
        <ProcessedMaterial title="Lumps" quantity={dumpData.processed[screening].lumps.total} grades={dumpData.processed[screening].lumps.grades} />
        {screening === "wet" && <ProcessedMaterial title="Tailings" quantity={dumpData.processed.wet.tailings} />}
      </DetailDrawer>

      <DetailDrawer
        open={drawer === "waste"}
        onClose={closeDrawer}
        eyebrow="Dumps Summary"
        title="Waste"
        description="Party and dump-wise waste generated from extraction."
      >
        <div className="dump-table-wrap">
          <table className="dump-table">
            <thead><tr><th>Party</th><th>Dump</th><th>Allocated</th><th>Waste</th></tr></thead>
            <tbody>
              {wasteRows.map((row) => (
                <tr key={`${row.party}-${row.dump}`}>
                  <td>{row.party}</td><td>{row.dump}</td><td>{formatMT(row.allocated)}</td><td>{formatMT(row.waste)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailDrawer>
        </>
      )}
    </section>
  );
}

function DumpCard({ title, value, label, rows, onClick }) {
  const content = (
    <>
      <div className="dump-card-top"><span>{title}</span>{onClick && <span className="dump-open-icon">↗</span>}</div>
      <strong className="dump-card-value">{value}</strong>
      {rows && (
        <div className="dump-card-rows">
          {rows.map((row) => (
            <div className="dump-card-row" key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>
          ))}
        </div>
      )}
      {label && <span className="dump-card-label">{label}</span>}
    </>
  );

  if (!onClick) return <div className="dump-card">{content}</div>;

  return <button type="button" className="dump-card dump-card-button" onClick={onClick}>{content}</button>;
}

function DumpAllocationTable({ title, rows }) {
  const total = rows.reduce((sum, row) => sum + row.allocated, 0);
  return (
    <div className="dump-table-section">
      <div className="dump-table-title">{title}</div>
      <div className="dump-table-wrap">
        <table className="dump-table">
          <thead><tr><th>Party</th><th>Allocated</th></tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.party}><td>{row.party}</td><td>{formatMT(row.allocated)}</td></tr>)}
            <tr className="total-row"><td>Total</td><td>{formatMT(total)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProcessedMaterial({ title, quantity, grades }) {
  return (
    <div className="processed-material-block">
      <div className="processed-material-heading"><strong>{title}</strong><span>{formatMT(quantity)}</span></div>
      {grades?.length > 0 && (
        <div className="processed-grade-list">
          {grades.map((grade) => <div className="processed-grade-row" key={`${title}-${grade.range}`}><span>{grade.range}</span><strong>{formatMT(grade.quantity)}</strong></div>)}
        </div>
      )}
      {!grades && <span className="no-grade-label">No grade applicable</span>}
    </div>
  );
}

export default DumpsSummary;
