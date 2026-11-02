import { useState, type ReactNode } from "react";
import {
  BreakdownList,
  Callout,
  KeyValueList,
  MetricTile,
  SegmentedControl,
  TileGrid,
  type SlideOverStat,
  type TabItem,
} from "../../components/ui";
import type { DashboardData } from "../../hooks/useDashboardData";
import type { CsvTable } from "../../lib/csv";
import {
  formatCrore,
  formatCurrency,
  formatMT,
  formatMillionMT,
  formatNumber,
  formatPercent,
  percentOf,
  sumBy,
} from "../../lib/format";
import type {
  CountMetric,
  DumpsSummaryData,
  MaterialComposition as Composition,
  PaymentHead,
  PermitType,
  ProcessingSource,
  ScreeningMethod,
  StockSource,
  StockView,
} from "../../types/dashboard";
import { compositionTotal, screeningTotal, type DashboardItem } from "../items/buildItems";
import { MaterialComposition } from "../shared/MaterialComposition";
import { SeriesBarChart } from "./DetailCharts";
import styles from "../shared/shared.module.css";

/**
 * Everything the drawer shows for one item: header stats, tabs and the
 * records table (also used for CSV export). One builder per module.
 */
export interface ItemDetail {
  description: string;
  stats: SlideOverStat[];
  tabs: TabItem[];
  records: CsvTable;
}

const MATERIALS = [
  { key: "rom", label: "ROM" },
  { key: "lumps", label: "Lumps" },
  { key: "fines", label: "Fines" },
] as const;

const materialAmount = (composition: Composition, key: "rom" | "lumps" | "fines") =>
  key === "rom" ? composition.rom : composition[key].total;

const gradeRecords = (composition: Composition) =>
  (["lumps", "fines"] as const).flatMap((material) =>
    composition[material].grades.map((grade) => [material === "lumps" ? "Lumps" : "Fines", grade.range, grade.quantity])
  );

/* =========================================================
   Stock
   ========================================================= */

const STOCK_VIEWS = [
  { value: "total", label: "Total" },
  { value: "transported", label: "Transported" },
  { value: "balance", label: "Balance" },
] as const;

function StockComposition({ source }: { source: StockSource }) {
  const [view, setView] = useState<StockView>("total");
  return (
    <>
      <SegmentedControl label="Stock view" options={STOCK_VIEWS} value={view} onChange={setView} />
      <Callout>
        <strong>Total</strong> is the stock recorded under this source, <strong>Transported</strong> is dispatched
        stock, and <strong>Balance</strong> is what remains.
      </Callout>
      <MaterialComposition composition={source.views[view]} />
    </>
  );
}

function stockDetail(source: StockSource): ItemDetail {
  const { total, transported, balance } = source.views;
  const totalMT = compositionTotal(total);
  const transportedMT = compositionTotal(transported);

  return {
    description: "Material-wise and grade-wise stock distribution",
    stats: [
      { label: "Total stock", value: formatMT(totalMT) },
      { label: "Transported", value: formatMT(transportedMT) },
      { label: "Balance", value: formatMT(compositionTotal(balance)) },
      { label: "Dispatched share", value: formatPercent(percentOf(transportedMT, totalMT)) },
    ],
    tabs: [
      { id: "composition", label: "Composition", content: <StockComposition source={source} /> },
      {
        id: "transport",
        label: "Transport",
        content: (
          <SeriesBarChart
            title="Transported vs balance by material"
            subtitle="Stacked to the total recorded stock"
            data={MATERIALS.map((material) => ({
              label: material.label,
              transported: materialAmount(transported, material.key),
              balance: materialAmount(balance, material.key),
            }))}
            category="label"
            series={[
              { key: "transported", label: "Transported" },
              { key: "balance", label: "Balance" },
            ]}
            format={formatMT}
            stacked
            horizontal
          />
        ),
      },
    ],
    records: {
      columns: ["Material", "Grade", "Total (MT)", "Transported (MT)", "Balance (MT)"],
      rows: [
        ["ROM", "—", total.rom, transported.rom, balance.rom],
        ...(["lumps", "fines"] as const).flatMap((material) =>
          total[material].grades.map((grade, index) => [
            material === "lumps" ? "Lumps" : "Fines",
            grade.range,
            grade.quantity,
            transported[material].grades[index]?.quantity ?? 0,
            balance[material].grades[index]?.quantity ?? 0,
          ])
        ),
      ],
    },
  };
}

/* =========================================================
   Processing
   ========================================================= */

function processingDetail(source: ProcessingSource): ItemDetail {
  const total = compositionTotal(source);
  return {
    description: "Processed stock composition and grade spread",
    stats: [
      { label: "Total processed", value: formatMT(total) },
      { label: "ROM", value: formatMT(source.rom) },
      { label: "Lumps", value: formatMT(source.lumps.total) },
      { label: "Fines", value: formatMT(source.fines.total) },
    ],
    tabs: [
      {
        id: "grades",
        label: "Grades",
        content: (
          <SeriesBarChart
            title="Quantity by grade"
            subtitle="Lumps and fines per Fe-grade band"
            data={source.lumps.grades.map((grade, index) => ({
              range: grade.range,
              lumps: grade.quantity,
              fines: source.fines.grades[index]?.quantity ?? 0,
            }))}
            category="range"
            series={[
              { key: "lumps", label: "Lumps" },
              { key: "fines", label: "Fines" },
            ]}
            format={formatMT}
          />
        ),
      },
      {
        id: "composition",
        label: "Composition",
        content: <MaterialComposition composition={source} chartVariant="columns" />,
      },
    ],
    records: { columns: ["Material", "Grade", "Quantity (MT)"], rows: [["ROM", "—", source.rom], ...gradeRecords(source)] },
  };
}

/* =========================================================
   Dumps
   ========================================================= */

const SCREENING_VIEWS = [
  { value: "wet", label: "Wet screening" },
  { value: "dry", label: "Dry screening" },
] as const;

function ScreeningView({ screening }: { screening: DumpsSummaryData["screening"] }) {
  const [method, setMethod] = useState<ScreeningMethod>("wet");
  const output = screening[method];
  return (
    <>
      <SegmentedControl label="Screening method" options={SCREENING_VIEWS} value={method} onChange={setMethod} />
      {output.tailings !== undefined && (
        <TileGrid>
          <MetricTile label="Tailings" value={formatMT(output.tailings)} caption="No grade applicable" />
          <MetricTile label="Screening total" value={formatMT(screeningTotal(output))} />
        </TileGrid>
      )}
      <MaterialComposition composition={output} />
    </>
  );
}

function dumpsDetail(id: string, dumps: DumpsSummaryData): ItemDetail {
  if (id === "dumps.annual") {
    const allocated = sumBy(dumps.allocation, (row) => row.allocated);
    const auctioned = sumBy(dumps.eauction, (row) => row.allocated);
    const parties = dumps.allocation.map((row) => row.party);
    return {
      description: "Annual dump quantity split between allocation and eAuction",
      stats: [
        { label: "Annual total", value: formatMillionMT(allocated + auctioned) },
        { label: "Allocation", value: formatMillionMT(allocated) },
        { label: "eAuction", value: formatMillionMT(auctioned) },
        { label: "Parties", value: formatNumber(parties.length) },
      ],
      tabs: [
        {
          id: "parties",
          label: "By party",
          content: (
            <SeriesBarChart
              title="Allotment by party"
              data={parties.map((party) => ({
                label: party,
                allocation: dumps.allocation.find((row) => row.party === party)?.allocated ?? 0,
                eauction: dumps.eauction.find((row) => row.party === party)?.allocated ?? 0,
              }))}
              category="label"
              series={[
                { key: "allocation", label: "Allocation" },
                { key: "eauction", label: "eAuction" },
              ]}
              format={formatMT}
              stacked
              horizontal
            />
          ),
        },
      ],
      records: {
        columns: ["Party", "Allocation (MT)", "eAuction (MT)"],
        rows: parties.map((party) => [
          party,
          dumps.allocation.find((row) => row.party === party)?.allocated ?? 0,
          dumps.eauction.find((row) => row.party === party)?.allocated ?? 0,
        ]),
      },
    };
  }

  if (id === "dumps.extracted") {
    const extracted = sumBy(dumps.extraction, (row) => row.extracted);
    const transported = sumBy(dumps.extraction, (row) => row.transported);
    return {
      description: "Extraction within geofence and onward transport",
      stats: [
        { label: "Extracted", value: formatMT(extracted) },
        { label: "Transported", value: formatMT(transported) },
        { label: "Balance", value: formatMT(Math.max(extracted - transported, 0)) },
        { label: "Transported share", value: formatPercent(percentOf(transported, extracted)) },
      ],
      tabs: [
        {
          id: "parties",
          label: "By party",
          content: (
            <SeriesBarChart
              title="Transported vs balance by party"
              data={dumps.extraction.map((row) => ({
                label: row.party,
                transported: row.transported,
                balance: Math.max(row.extracted - row.transported, 0),
              }))}
              category="label"
              series={[
                { key: "transported", label: "Transported" },
                { key: "balance", label: "Balance" },
              ]}
              format={formatMT}
              stacked
              horizontal
            />
          ),
        },
      ],
      records: {
        columns: ["Party", "Extracted (MT)", "Transported (MT)", "Balance (MT)"],
        rows: dumps.extraction.map((row) => [
          row.party,
          row.extracted,
          row.transported,
          Math.max(row.extracted - row.transported, 0),
        ]),
      },
    };
  }

  if (id === "dumps.processed") {
    const { wet, dry } = dumps.screening;
    return {
      description: "Processing output by screening method",
      stats: [
        { label: "Total processed", value: formatMT(screeningTotal(wet) + screeningTotal(dry)) },
        { label: "Wet screening", value: formatMT(screeningTotal(wet)) },
        { label: "Dry screening", value: formatMT(screeningTotal(dry)) },
        { label: "Tailings", value: formatMT(wet.tailings ?? 0) },
      ],
      tabs: [
        {
          id: "compare",
          label: "Wet vs dry",
          content: (
            <SeriesBarChart
              title="Output by material"
              data={[
                ...MATERIALS.map((material) => ({
                  label: material.label,
                  wet: materialAmount(wet, material.key),
                  dry: materialAmount(dry, material.key),
                })),
                { label: "Tailings", wet: wet.tailings ?? 0, dry: dry.tailings ?? 0 },
              ]}
              category="label"
              series={[
                { key: "wet", label: "Wet" },
                { key: "dry", label: "Dry" },
              ]}
              format={formatMT}
            />
          ),
        },
        { id: "grades", label: "Grades", content: <ScreeningView screening={dumps.screening} /> },
      ],
      records: {
        columns: ["Method", "Material", "Grade", "Quantity (MT)"],
        rows: (["wet", "dry"] as const).flatMap((method) => [
          [method === "wet" ? "Wet" : "Dry", "ROM", "—", dumps.screening[method].rom],
          ...gradeRecords(dumps.screening[method]).map((row) => [method === "wet" ? "Wet" : "Dry", ...row]),
          ...(dumps.screening[method].tailings !== undefined
            ? [[method === "wet" ? "Wet" : "Dry", "Tailings", "—", dumps.screening[method].tailings ?? 0]]
            : []),
        ]),
      },
    };
  }

  const waste = sumBy(dumps.waste, (row) => row.waste);
  const extracted = sumBy(dumps.extraction, (row) => row.extracted);
  return {
    description: "Party and dump-wise waste generated from extraction",
    stats: [
      { label: "Total waste", value: formatMT(waste) },
      { label: "Dumps", value: formatNumber(dumps.waste.length) },
      { label: "Of extracted", value: formatPercent(percentOf(waste, extracted)) },
    ],
    tabs: [
      {
        id: "dumps",
        label: "By dump",
        content: (
          <SeriesBarChart
            title="Waste by dump"
            data={dumps.waste.map((row) => ({ label: `${row.dump} · ${row.party}`, waste: row.waste }))}
            category="label"
            series={[{ key: "waste", label: "Waste" }]}
            format={formatMT}
            horizontal
          />
        ),
      },
    ],
    records: {
      columns: ["Party", "Dump", "Allocated (MT)", "Waste (MT)"],
      rows: dumps.waste.map((row) => [row.party, row.dump, row.allocated, row.waste]),
    },
  };
}

/* =========================================================
   Payments
   ========================================================= */

function paymentDetail(head: PaymentHead, data: DashboardData): ItemDetail {
  const revenue = sumBy(data.payments, (entry) => entry.total);
  const share = head.total / (revenue || 1);
  const materials = head.type === "material" ? head.materials : null;

  const regionPanels: ReactNode =
    head.type === "regional" ? (
      <div className={styles.twoColumn}>
        {head.regions.map((region) => (
          <div className={styles.panel} key={region.key}>
            <div className={styles.panelHeader}>
              <h3>{region.name}</h3>
              <strong>{formatCurrency(region.total)}</strong>
            </div>
            <KeyValueList
              items={MATERIALS.map((material) => ({
                label: material.label,
                hint: formatMT(region.materials[material.key].stock),
                value: formatCurrency(region.materials[material.key].amount),
              }))}
            />
          </div>
        ))}
      </div>
    ) : null;

  const tabs: TabItem[] = [];

  if (materials) {
    tabs.push({
      id: "materials",
      label: "By material",
      content: (
        <SeriesBarChart
          title="Payment by material"
          data={MATERIALS.map((material) => ({ label: material.label, amount: materials[material.key].amount }))}
          category="label"
          series={[{ key: "amount", label: "Amount" }]}
          format={formatCrore}
          horizontal
        />
      ),
    });
  }

  if (head.type === "regional") {
    tabs.push({
      id: "regions",
      label: "By region",
      content: (
        <>
          <SeriesBarChart
            title="Payment by region and material"
            data={head.regions.map((region) => ({
              label: region.name,
              ...Object.fromEntries(MATERIALS.map((material) => [material.key, region.materials[material.key].amount])),
            }))}
            category="label"
            series={MATERIALS.map((material) => ({ key: material.key, label: material.label }))}
            format={formatCrore}
            stacked
            horizontal
          />
          {regionPanels}
        </>
      ),
    });
  }

  tabs.push({
    id: "trend",
    label: "Collection trend",
    content: (
      <SeriesBarChart
        title={`${head.title} collected over time`}
        subtitle="Prototype: estimated from the overall revenue trend"
        data={data.trends.points.map((point) => ({ label: point.label, amount: Math.round(point.revenue * share) }))}
        category="label"
        series={[{ key: "amount", label: "Collected" }]}
        format={formatCrore}
      />
    ),
  });

  return {
    description: head.description,
    stats: [
      { label: "Total payment", value: formatCrore(head.total) },
      { label: "Rate", value: head.rate },
      { label: "Share of revenue", value: formatPercent(share * 100) },
      ...(head.type === "regional" ? [{ label: "Regions", value: formatNumber(head.regions.length) }] : []),
    ],
    tabs,
    records:
      head.type === "regional"
        ? {
            columns: ["Region", "Material", "Stock paid for (MT)", "Amount (₹)"],
            rows: head.regions.flatMap((region) =>
              MATERIALS.map((material) => [
                region.name,
                material.label,
                region.materials[material.key].stock,
                region.materials[material.key].amount,
              ])
            ),
          }
        : {
            columns: ["Material", "Stock paid for (MT)", "Amount (₹)"],
            rows: MATERIALS.map((material) => [
              material.label,
              head.materials[material.key].stock,
              head.materials[material.key].amount,
            ]),
          },
  };
}

/* =========================================================
   Permits
   ========================================================= */

function permitDetail(permit: PermitType, data: DashboardData): ItemDetail {
  const today = sumBy(data.permits, (entry) => entry.count);
  const share = permit.count / (today || 1);
  const top = (list: PermitType["categories"]) => list.reduce((best, item) => (item.count > best.count ? item : best));

  return {
    description: `${permit.count} permits applied today`,
    stats: [
      { label: "Permits today", value: formatNumber(permit.count) },
      { label: "Share of today", value: formatPercent(share * 100) },
      { label: "Top category", value: top(permit.categories).label },
      { label: "Top purpose", value: top(permit.purposes).label },
    ],
    tabs: [
      {
        id: "categories",
        label: "Categories",
        content: (
          <BreakdownList
            title="Category breakdown"
            subtitle="How today's permits are distributed by category"
            items={permit.categories}
            total={permit.count}
          />
        ),
      },
      {
        id: "purposes",
        label: "Purposes",
        content: (
          <>
            <BreakdownList
              title="Purpose breakdown"
              subtitle="How today's permits are distributed by purpose"
              items={permit.purposes}
              total={permit.count}
            />
            <p className={styles.muted}>Category and purpose are independent breakdowns of the same permits.</p>
          </>
        ),
      },
      {
        id: "trend",
        label: "Trend",
        content: (
          <SeriesBarChart
            title={`${permit.title} permits over time`}
            subtitle="Prototype: estimated from the overall permit trend"
            data={data.trends.points.map((point) => ({ label: point.label, permits: Math.round(point.permits * share) }))}
            category="label"
            series={[{ key: "permits", label: "Permits" }]}
            format={formatNumber}
          />
        ),
      },
    ],
    records: {
      columns: ["Breakdown", "Label", "Count"],
      rows: [
        ...permit.categories.map((item) => ["Category", item.label, item.count]),
        ...permit.purposes.map((item) => ["Purpose", item.label, item.count]),
      ],
    },
  };
}

/* =========================================================
   Count metrics (operations, master data, violations)
   ========================================================= */

function countDetail(metric: CountMetric, isViolations: boolean): ItemDetail {
  const top = metric.details.reduce((best, item) => (item.count > best.count ? item : best));
  const tone = isViolations ? "critical" : "brand";

  return {
    description: metric.label,
    stats: [
      { label: isViolations ? "Total violations" : "Total", value: formatNumber(metric.count) },
      { label: top.label, value: formatNumber(top.count) },
      { label: "Share", value: formatPercent(percentOf(top.count, metric.count)) },
      { label: "Categories", value: formatNumber(metric.details.length) },
    ],
    tabs: [
      {
        id: "breakdown",
        label: "Breakdown",
        content: (
          <>
            {isViolations && (
              <Callout>
                Sample figures for prototype review. These will be replaced with live system data when the API is
                available.
              </Callout>
            )}
            <SeriesBarChart
              title={`${metric.title} by category`}
              data={metric.details.map((detail) => ({ label: detail.label, count: detail.count }))}
              category="label"
              series={[{ key: "count", label: "Count" }]}
              format={formatNumber}
              horizontal
            />
            <BreakdownList items={metric.details} total={metric.count} tone={tone} />
          </>
        ),
      },
    ],
    records: {
      columns: ["Category", "Count", "Share"],
      rows: metric.details.map((detail) => [
        detail.label,
        detail.count,
        formatPercent(percentOf(detail.count, metric.count)),
      ]),
    },
  };
}

/* =========================================================
   Registry
   ========================================================= */

export function getItemDetail(item: DashboardItem, data: DashboardData): ItemDetail | null {
  const key = item.id.slice(item.id.indexOf(".") + 1);

  switch (item.module) {
    case "stock": {
      const source = data.stock.find((entry) => entry.key === key);
      return source ? stockDetail(source) : null;
    }
    case "processing": {
      const source = data.processing.find((entry) => entry.key === key);
      return source ? processingDetail(source) : null;
    }
    case "dumps":
      return dumpsDetail(item.id, data.dumps);
    case "payments": {
      const head = data.payments.find((entry) => entry.key === key);
      return head ? paymentDetail(head, data) : null;
    }
    case "permits": {
      const permit = data.permits.find((entry) => entry.id === key);
      return permit ? permitDetail(permit, data) : null;
    }
    case "operations": {
      const metric = data.operations.find((entry) => entry.id === key);
      return metric ? countDetail(metric, false) : null;
    }
    case "master": {
      if (key === "violations") return countDetail(data.masterData.violations, true);
      const entity = data.masterData.entities.find((entry) => entry.id === key);
      return entity ? countDetail(entity, false) : null;
    }
  }
}
