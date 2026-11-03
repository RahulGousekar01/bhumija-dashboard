import React from "react";
import { CHART_COLORS, formatMT } from "../common/ChartCard/chartTheme";
import { processingData } from "./OreProcessing";
import InfoTip from "../common/InfoTip/InfoTip";
import "./OreProcessingCharts.css";

const sum = (items, pick) => items.reduce((total, item) => total + pick(item), 0);
const share = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

const sourceLabel = (source) =>
  source.flag ? `${source.title} · ${source.flag === "PRIMARY" ? "Primary" : "Secondary"}` : source.title;

const MATERIALS = [
  { key: "lumps", label: "Lumps", color: CHART_COLORS.lumps, pick: (source) => source.lumps.total },
  { key: "fines", label: "Fines", color: CHART_COLORS.fines, pick: (source) => source.fines.total },
  { key: "rom", label: "ROM", color: CHART_COLORS.rom, pick: (source) => source.rom },
];

/*
 * Grade tiers by Fe %. Band midpoints are used to work out the
 * average Fe grade until the API sends assay-wise figures.
 */
const TIERS = [
  { key: "high", label: "High grade", color: "#2b8a3e", test: (min) => min >= 55 },
  { key: "medium", label: "Medium grade", color: "#f08c00", test: (min) => min >= 51 && min < 55 },
  { key: "low", label: "Low grade", color: "#adb5bd", test: (min) => min < 51 },
];

const bandMin = (range) => parseInt(range, 10);
const bandMid = (range) => {
  const [min, max] = range.split("–").map((part) => parseInt(part, 10));
  return (min + max) / 2;
};

// Lumps and fines grades of a source, as one list.
const gradedBands = (source) => [...source.lumps.grades, ...source.fines.grades];

const tierTotal = (bands, tier) =>
  sum(bands.filter((band) => tier.test(bandMin(band.range))), (band) => band.quantity);

const averageFe = (bands) => {
  const quantity = sum(bands, (band) => band.quantity);
  return quantity > 0 ? sum(bands, (band) => band.quantity * bandMid(band.range)) / quantity : 0;
};

/** Charts under the Ore Processing cards. */
function OreProcessingCharts() {
  const sources = Object.values(processingData);

  return (
    <div className="section-charts">
      <ProcessedOutput sources={sources} />
      <ProcessedQuality sources={sources} />
    </div>
  );
}

/* =========================================
   1. What the processed ore became
========================================= */

function ProcessedOutput({ sources }) {
  const total = sum(sources, (source) => source.total);
  const overall = MATERIALS.map((material) => ({ ...material, value: sum(sources, material.pick) }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>What the Processed Ore Became</h3>
        <span>Total {formatMT(total)}</span>
      </div>

      <div className="output-strip" aria-hidden="true">
        {overall.map((material) => (
          <span key={material.key} style={{ width: `${share(material.value, total)}%`, background: material.color }}>
            {share(material.value, total) >= 12 && `${material.label} ${share(material.value, total)}%`}
          </span>
        ))}
      </div>

      <ul className="output-strip-legend">
        {overall.map((material) => (
          <li key={material.key}>
            <i style={{ background: material.color }} aria-hidden="true" />
            <span>{material.label}</span>
            <strong>{formatMT(material.value)}</strong>
            <em>{share(material.value, total)}%</em>
          </li>
        ))}
      </ul>

      <h4 className="output-sources-title">By source</h4>
      <ul className="output-sources">
        {sources.map((source) => {
          const lumpsShare = share(source.lumps.total, source.total);
          return (
            <li key={source.key}>
              <div className="output-source-head">
                <strong>{sourceLabel(source)}</strong>
                <span>{formatMT(source.total)}</span>
              </div>
              <div className="output-source-bar" aria-hidden="true">
                {MATERIALS.map((material) => (
                  <span
                    key={material.key}
                    style={{ width: `${share(material.pick(source), source.total)}%`, background: material.color }}
                  />
                ))}
              </div>
              <span className="output-source-note">{lumpsShare}% became Lumps</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================
   2. Quality of processed ore
========================================= */

function ProcessedQuality({ sources }) {
  const allBands = sources.flatMap(gradedBands);
  const graded = sum(allBands, (band) => band.quantity);

  // Every grade band across all sources, highest grade first.
  const bands = sources[0].lumps.grades
    .map((grade, index) => {
      const lumps = sum(sources, (source) => source.lumps.grades[index].quantity);
      const fines = sum(sources, (source) => source.fines.grades[index].quantity);
      return { range: grade.range, lumps, fines, total: lumps + fines };
    })
    .reverse();

  const tiers = TIERS.map((tier) => {
    const tierBands = bands.filter((band) => tier.test(bandMin(band.range)));
    return { ...tier, bands: tierBands, value: sum(tierBands, (band) => band.total) };
  });

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Quality of Processed Ore</h3>
        <span>
          All sources combined (eAuction + Royalty Paid · Primary + Secondary) · Lumps + Fines {formatMT(graded)}
        </span>
      </div>

      <div className="quality-tiers">
        {tiers.map((tier) => (
          <div key={tier.key} className="quality-tier" style={{ borderTopColor: tier.color }}>
            <span className="quality-tier-label">{tier.label}</span>
            <strong>{share(tier.value, graded)}%</strong>
            <span className="quality-tier-value">{formatMT(tier.value)}</span>

            <ul className="quality-tier-bands">
              {tier.bands.map((band) => (
                <li key={band.range} title={`Lumps ${formatMT(band.lumps)} · Fines ${formatMT(band.fines)}`}>
                  <span>{band.range}</span>
                  <b>{band.total.toLocaleString("en-IN")}</b>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="quality-sources">
        <span className="quality-sources-title">
          Average grade
          <InfoTip title="How the average grade is worked out">
            Each source's lumps and fines are recorded in Fe grade bands. We take the middle of each band (for
            example 55–59% counts as 57%), weight it by the tonnes in that band, and divide by the source's
            total graded tonnes. "High grade" is the share of those tonnes at 55% Fe or above. ROM is not graded.
          </InfoTip>
        </span>
        {sources.map((source) => {
          const sourceBands = gradedBands(source);
          const sourceGraded = sum(sourceBands, (band) => band.quantity);
          return (
            <span key={source.key} className="quality-source">
              {sourceLabel(source)} <b>{averageFe(sourceBands).toFixed(1)}% Fe</b>
              <em>{share(tierTotal(sourceBands, TIERS[0]), sourceGraded)}% high grade</em>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default OreProcessingCharts;
