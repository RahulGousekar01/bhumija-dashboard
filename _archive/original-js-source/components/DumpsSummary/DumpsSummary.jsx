import React, { useMemo, useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import "./DumpsSummary.css";

const dumpData = {
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

const formatMT = (value) => `${value.toLocaleString("en-IN")} MT`;
const formatMillionMT = (value) => `${(value / 1000000).toFixed(1)} M MT`;

function DumpsSummary() {
  const { isParty } = useDashboard();
  const [drawer, setDrawer] = useState(null);
  const [extractedView, setExtractedView] = useState("geofence");
  const [screening, setScreening] = useState("wet");

  const totalAnnualDump = useMemo(() => {
    const allocation = dumpData.annualTotal.allocation.reduce((sum, row) => sum + row.allocated, 0);
    const eauction = dumpData.annualTotal.eauction.reduce((sum, row) => sum + row.allocated, 0);
    return allocation + eauction;
  }, []);

  const ownExtracted = dumpData.extracted.parties[0];
  const extractedRows = isParty ? [ownExtracted] : dumpData.extracted.parties;
  const wasteRows = isParty ? [dumpData.waste[0]] : dumpData.waste;
  const visibleExtracted = isParty
    ? { extracted: ownExtracted.extracted, transported: ownExtracted.transported }
    : {
        extracted: dumpData.extracted.parties.reduce((sum, row) => sum + row.extracted, 0),
        transported: dumpData.extracted.parties.reduce((sum, row) => sum + row.transported, 0),
      };

  const openDrawer = (type) => setDrawer(type);
  const closeDrawer = () => setDrawer(null);

  return (
    <section className="dumps-summary-section">
      <div className="section-header">
        <div>
          <h2>Dumps Summary</h2>
          <p>Dump allocation, extraction, processing and waste monitoring</p>
        </div>
      </div>

      <div className="dumps-summary-grid">
        <DumpCard
          title="Annual Total Dump"
          value={formatMillionMT(totalAnnualDump)}
          label="Allocation + eAuction"
          onClick={() => openDrawer("annual")}
        />
        <DumpCard
          title="Extracted"
          value={formatMT(isParty ? ownExtracted.extracted : dumpData.extracted.total)}
          label="Extracted within geofence"
          onClick={() => openDrawer("extracted")}
        />
        <DumpCard
          title="Processed"
          value={formatMT(dumpData.processed.wet.total)}
          label="Wet + Dry screening"
          onClick={() => openDrawer("processed")}
        />
        <DumpCard
          title="Waste"
          value={formatMT(wasteRows.reduce((sum, row) => sum + row.waste, 0))}
          label={isParty ? "Waste generated" : "Party-wise waste"}
          onClick={isParty ? undefined : () => openDrawer("waste")}
        />
      </div>

      <DetailDrawer
        open={drawer === "annual"}
        onClose={closeDrawer}
        eyebrow="Dumps Summary"
        title="Annual Total Dump"
        description="Annual dump quantity split between allocation and eAuction."
      >
        <DumpAllocationTable title="Allocation" rows={dumpData.annualTotal.allocation} />
        <DumpAllocationTable title="EAuction" rows={dumpData.annualTotal.eauction} />
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
    </section>
  );
}

function DumpCard({ title, value, label, onClick }) {
  const content = (
    <>
      <div className="dump-card-top"><span>{title}</span>{onClick && <span className="dump-open-icon">↗</span>}</div>
      <strong className="dump-card-value">{value}</strong>
      <span className="dump-card-label">{label}</span>
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
