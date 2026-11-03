import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboard } from "../../context/DashboardContext";
import ChartCard from "../common/ChartCard/ChartCard";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE, formatCompact, formatMT } from "../common/ChartCard/chartTheme";
import { dumpData } from "./DumpsSummary";

const shortName = (party) => party.replace(" Pvt Ltd", "");
const formatMillion = (value) => `${(value / 1000000).toFixed(1)} M`;
const rowHeight = (rows) => Math.max(rows * 48 + 40, 160);
const VALUE_LABEL = { fontSize: 11, fill: "#495057" };

/**
 * Charts under the Dumps Summary cards: plain horizontal bars.
 * All parties: one row per party. One party (a Party user, or a Super Admin
 * filtering on a party): that party's own allotment and material.
 */
function DumpsSummaryCharts({ scopeParty, processed }) {
  return scopeParty ? (
    <PartyCharts party={scopeParty} processed={processed} />
  ) : (
    <AllPartiesCharts />
  );
}

/* ---------- All parties (Super Admin) ---------- */

function AllPartiesCharts() {
  const allotment = dumpData.annualTotal.allocation
    .map((row) => ({
      name: shortName(row.party),
      Allocation: row.allocated,
      eAuction: dumpData.annualTotal.eauction.find((item) => item.party === row.party)?.allocated ?? 0,
    }))
    .map((row) => ({ ...row, total: row.Allocation + row.eAuction }))
    .sort((a, b) => b.total - a.total);

  const extraction = dumpData.extracted.parties.map((row) => ({
    name: shortName(row.party),
    Extracted: row.extracted,
    Transported: row.transported,
  }));

  return (
    <div className="section-charts">
      <ChartCard
        title="Annual Dump Allotment to Party"
        subtitle="Allocation and eAuction (MT)"
        height={rowHeight(allotment.length)}
        legend={[
          { label: "Allocation", color: CHART_COLORS.primary },
          { label: "eAuction", color: CHART_COLORS.blue },
        ]}
      >
        <BarChart data={allotment} layout="vertical" margin={{ top: 4, right: 56, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#f1f3f5" />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={110} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMT(value)} cursor={{ fill: "#fff5f5" }} />
          <Bar dataKey="Allocation" stackId="dump" fill={CHART_COLORS.primary} maxBarSize={22} />
          <Bar dataKey="eAuction" stackId="dump" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} maxBarSize={22}>
            <LabelList dataKey="total" position="right" formatter={formatMillion} style={VALUE_LABEL} />
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard
        title="Extracted vs Transported"
        subtitle="Within geofence (MT)"
        height={rowHeight(extraction.length)}
        legend={[
          { label: "Extracted", color: CHART_COLORS.primary },
          { label: "Transported", color: CHART_COLORS.green },
        ]}
      >
        <BarChart data={extraction} layout="vertical" margin={{ top: 4, right: 56, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#f1f3f5" />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={110} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMT(value)} cursor={{ fill: "#fff5f5" }} />
          <Bar dataKey="Extracted" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} maxBarSize={14}>
            <LabelList dataKey="Extracted" position="right" formatter={formatCompact} style={VALUE_LABEL} />
          </Bar>
          <Bar dataKey="Transported" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} maxBarSize={14}>
            <LabelList dataKey="Transported" position="right" formatter={formatCompact} style={VALUE_LABEL} />
          </Bar>
        </BarChart>
      </ChartCard>
    </div>
  );
}

/* ---------- One party ---------- */

function PartyCharts({ party, processed }) {
  const { isParty } = useDashboard();
  const allocation = dumpData.annualTotal.allocation.find((row) => row.party === party)?.allocated ?? 0;
  const eauction = dumpData.annualTotal.eauction.find((row) => row.party === party)?.allocated ?? 0;
  const extracted = dumpData.extracted.parties.find((row) => row.party === party) ?? { extracted: 0, transported: 0 };
  const waste = dumpData.waste.find((row) => row.party === party)?.waste ?? 0;

  const allotment = [
    { name: "Allocation", value: allocation, color: CHART_COLORS.primary },
    { name: "eAuction", value: eauction, color: CHART_COLORS.blue },
  ];

  // What happened to the dump material this party extracted.
  const material = [
    { name: "Extracted", value: extracted.extracted, color: CHART_COLORS.primary },
    { name: "Processed", value: processed, color: CHART_COLORS.fines },
    { name: "Transported", value: extracted.transported, color: CHART_COLORS.green },
    { name: "Within geofence", value: Math.max(extracted.extracted - extracted.transported, 0), color: CHART_COLORS.rom },
    { name: "Waste", value: waste, color: CHART_COLORS.grey },
  ];

  return (
    <div className="section-charts">
      <ChartCard
        title="Annual Dump Allotment"
        subtitle={`${shortName(party)} · ${formatMillion(allocation + eauction)} MT in total`}
        height={rowHeight(allotment.length)}
      >
        <BarChart data={allotment} layout="vertical" margin={{ top: 4, right: 56, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#f1f3f5" />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={110} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMT(value)} cursor={{ fill: "#fff5f5" }} />
          <Bar dataKey="value" name="Allotted" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {allotment.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
            <LabelList dataKey="value" position="right" formatter={formatMillion} style={VALUE_LABEL} />
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard
        title={isParty ? "Your Dump Material" : `Dump Material · ${shortName(party)}`}
        subtitle="Extracted, processed, transported, still within geofence and waste (MT)"
        height={rowHeight(material.length)}
      >
        <BarChart data={material} layout="vertical" margin={{ top: 4, right: 56, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#f1f3f5" />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={110} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMT(value)} cursor={{ fill: "#fff5f5" }} />
          <Bar dataKey="value" name="Quantity" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {material.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
            <LabelList dataKey="value" position="right" formatter={formatCompact} style={VALUE_LABEL} />
          </Bar>
        </BarChart>
      </ChartCard>
    </div>
  );
}

export default DumpsSummaryCharts;
