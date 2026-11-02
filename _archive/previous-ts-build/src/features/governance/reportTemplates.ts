import { ALL, COMPARE_OPTIONS, PERIODS } from "../../config/filterOptions";
import { formatDate, formatDateTime } from "../../lib/dates";
import { formatCrore, formatDelta, formatNumber, formatPercent, percentOf, sumBy } from "../../lib/format";
import type { ReportMeta, ReportSection } from "../../lib/reports/official";
import type { DashboardFilters } from "../../types/dashboard";
import { AGE_BUCKETS, type GovernanceSnapshot, type KpiId, type Officer, type RegisterRecord } from "../../types/governance";

/*
 * Report templates: each turns the current snapshot (already scoped by the
 * filters) into letterhead metadata plus table sections.
 */

export interface ReportTemplate {
  id: string;
  code: string;
  title: string;
  description: string;
  build: (context: ReportContext) => { meta: ReportMeta; sections: ReportSection[] };
}

export interface ReportContext {
  snapshot: GovernanceSnapshot;
  filters: DashboardFilters;
  officer: Officer;
  /** Records currently shown in the register (for the register extract). */
  visibleRecords: RegisterRecord[];
}

export function describeFilters(filters: DashboardFilters): string[] {
  const parts: string[] = [];
  const period = PERIODS.find((option) => option.value === filters.period);
  parts.push(
    filters.period === "RANGE"
      ? `Period: ${formatDate(filters.rangeFrom)} to ${formatDate(filters.rangeTo)}`
      : `Period: ${period?.label ?? filters.period}`
  );
  if (filters.district !== ALL) parts.push(`District: ${filters.district}`);
  if (filters.taluka !== ALL) parts.push(`Taluka: ${filters.taluka}`);
  if (filters.organisation !== ALL) parts.push(`Party: ${filters.organisation === "CURRENT_PARTY" ? "Own organisation" : filters.organisation}`);
  parts.push(`Compared with: ${COMPARE_OPTIONS.find((option) => option.value === filters.compare)?.label}`);
  return parts;
}

const isProvisional = (snapshot: GovernanceSnapshot) =>
  snapshot.asOf.asOfDate === snapshot.asOf.latestDate && snapshot.asOf.sources.some((source) => source.state !== "reconciled");

const metaFor = (context: ReportContext, code: string, title: string): ReportMeta => ({
  title,
  code,
  asOfDate: context.snapshot.asOf.asOfDate,
  batchId: context.snapshot.asOf.batchId,
  provisional: isProvisional(context.snapshot),
  filters: describeFilters(context.filters),
  officer: context.officer,
});

const KPI_LABELS: Record<KpiId, string> = {
  revenue: "Revenue collected",
  dispatch: "Ore dispatched (MT)",
  permits: "Permits issued",
  pending: "Approvals pending > 7 days",
  discrepancies: "Open discrepancies",
  expiring: "Permits expiring within 7 days",
};

const recordRow = (record: RegisterRecord) => [
  record.refNo,
  record.subtype,
  record.party,
  `${record.taluka} (${record.district})`,
  formatNumber(record.quantity),
  formatNumber(record.amount),
  formatDate(record.date),
  record.ageDays,
  record.recon.state === "variance" ? `Variance ${record.recon.variancePct}%` : record.recon.state === "provisional" ? "Provisional" : "Reconciled",
  record.status,
  record.discrepancies.filter((item) => item.status === "Open" || item.status === "Under review").length,
];

const RECORD_COLUMNS = ["Reference", "Type", "Party", "Jurisdiction", "Qty (MT)", "Value (Rs.)", "Date", "Age (d)", "Reconciliation", "Status", "Open flags"];

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "mis",
    code: "MIS",
    title: "Daily MIS (T-1)",
    description: "KPIs, jurisdiction rollup, fee heads, ageing and sign-off",
    build: (context) => {
      const { snapshot } = context;
      const compare = COMPARE_OPTIONS.find((option) => option.value === context.filters.compare)?.label ?? "";
      const format = (id: KpiId, value: number) => (id === "revenue" ? formatCrore(value) : formatNumber(value));
      return {
        meta: metaFor(context, "MIS", `Daily MIS Report — data as of ${formatDate(snapshot.asOf.asOfDate)}`),
        sections: [
          {
            heading: "Key figures",
            kind: "table",
            columns: ["Indicator", "Value", `Change vs ${compare.toLowerCase()}`, "vs 7-day average", "Target"],
            numeric: [1, 2, 3, 4],
            rows: (Object.keys(KPI_LABELS) as KpiId[]).map((id) => {
              const kpi = snapshot.kpis[id];
              return [
                KPI_LABELS[id],
                format(id, kpi.value),
                formatDelta(kpi.delta),
                formatDelta(kpi.vsBaseline),
                kpi.target ? `${formatCrore(kpi.target)} (${formatPercent(percentOf(kpi.value, kpi.target))})` : "—",
              ];
            }),
          },
          {
            heading: "Jurisdiction rollup",
            kind: "table",
            columns: ["Jurisdiction", "Level", "Dispatch (MT)", `Change vs ${compare.toLowerCase()}`, "Revenue", "Permits", "Pending", "Discrepancies"],
            numeric: [2, 3, 4, 5, 6, 7],
            rows: snapshot.rollup.map((row) => [
              row.name,
              row.level === "district" ? "District" : "Taluka",
              formatNumber(row.dispatch),
              formatDelta(row.dispatchDelta),
              formatCrore(row.revenue),
              row.permits,
              row.pending,
              row.discrepancies,
            ]),
          },
          {
            heading: "Ageing of open items",
            kind: "table",
            columns: ["Queue", ...AGE_BUCKETS, "SLA (days)", "Past SLA"],
            numeric: [1, 2, 3, 4, 5, 6],
            rows: snapshot.ageing.map((row) => [row.queue, ...AGE_BUCKETS.map((bucket) => row.buckets[bucket]), row.slaDays, row.breaches]),
          },
          {
            heading: "Review sign-off",
            kind: "table",
            columns: ["Jurisdiction", "Officer", "Status", "Signed at", "Open items", "Remark"],
            rows: snapshot.signOff.map((row) => [
              row.jurisdiction,
              `${row.officer}, ${row.designation}`,
              row.state,
              row.signedAt ? formatDateTime(row.signedAt) : "—",
              row.openItems,
              row.remark ?? "—",
            ]),
          },
        ],
      };
    },
  },
  {
    id: "register",
    code: "REG",
    title: "Register extract",
    description: "The records currently shown in the register, with its filters",
    build: (context) => ({
      meta: metaFor(context, "REG", `Register Extract — ${context.visibleRecords.length} records`),
      sections: [
        {
          heading: "Records",
          kind: "table",
          columns: RECORD_COLUMNS,
          numeric: [4, 5, 7, 10],
          rows: context.visibleRecords.map(recordRow),
          note: `Totals: ${formatNumber(sumBy(context.visibleRecords, (record) => record.quantity))} MT; Rs. ${formatNumber(
            sumBy(context.visibleRecords, (record) => record.amount)
          )}.`,
        },
      ],
    }),
  },
  {
    id: "discrepancies",
    code: "DSC",
    title: "Discrepancy register",
    description: "All rule-based and manual flags with status and severity",
    build: (context) => {
      const rows = context.snapshot.records.flatMap((record) =>
        record.discrepancies.map((item) => [
          item.raisedOn ? formatDate(item.raisedOn) : "",
          record.refNo,
          record.party,
          record.taluka,
          item.rule,
          item.severity.toUpperCase(),
          item.status,
          item.detail,
        ])
      );
      return {
        meta: metaFor(context, "DSC", "Discrepancy Register"),
        sections: [
          {
            heading: "Discrepancies",
            kind: "table",
            columns: ["Raised on", "Reference", "Party", "Taluka", "Rule", "Severity", "Status", "Detail"],
            rows,
          },
        ],
      };
    },
  },
  {
    id: "reconciliation",
    code: "REC",
    title: "Batch reconciliation statement",
    description: "Source feeds for the batch and records still provisional",
    build: (context) => {
      const { snapshot } = context;
      const provisional = snapshot.records.filter((record) => record.recon.state === "provisional");
      const variances = snapshot.records.filter((record) => record.recon.state === "variance");
      return {
        meta: metaFor(context, "REC", `Batch Reconciliation Statement — ${snapshot.asOf.batchId}`),
        sections: [
          {
            heading: "Source feeds",
            kind: "table",
            columns: ["Source", "Status", "Synced at", "Detail"],
            rows: snapshot.asOf.sources.map((source) => [
              source.name,
              source.state === "reconciled" ? "Reconciled" : source.state === "partial" ? "Partial" : "Awaited",
              source.syncedAt ? formatDateTime(source.syncedAt) : "—",
              source.detail,
            ]),
          },
          {
            heading: "Provisional records (awaiting a source)",
            kind: "table",
            columns: ["Reference", "Type", "Party", "Taluka", "Qty (MT)", "Awaiting"],
            numeric: [4],
            rows: provisional.map((record) => [record.refNo, record.subtype, record.party, record.taluka, formatNumber(record.quantity), record.recon.pendingSource ?? ""]),
          },
          {
            heading: "Records with variance between sources",
            kind: "table",
            columns: ["Reference", "Type", "Party", "Variance %", ...["Source A", "Source B"]],
            numeric: [3],
            rows: variances.map((record) => [
              record.refNo,
              record.subtype,
              record.party,
              record.recon.variancePct,
              `${record.recon.sources[0]?.label}: ${formatNumber(record.recon.sources[0]?.quantity ?? 0)}`,
              `${record.recon.sources[1]?.label}: ${formatNumber(record.recon.sources[1]?.quantity ?? 0)}`,
            ]),
          },
        ],
      };
    },
  },
];

/** Single-record sheet, generated from the drawer. */
export function recordSheet(context: ReportContext, record: RegisterRecord) {
  const fields: [string, string][] = [
    ["Reference", record.refNo],
    ["Type", record.subtype],
    ["Party", record.party],
    ["Jurisdiction", `${record.district} › ${record.taluka} › ${record.location}`],
    ["Mineral / form / grade", `${record.mineral} · ${record.oreForm} · ${record.gradeSlab}`],
    ["Quantity", `${formatNumber(record.quantity)} MT`],
    ["Value", `Rs. ${formatNumber(record.amount)}`],
    ["Date", formatDate(record.date)],
    ...(record.validUpto ? ([["Valid up to", formatDate(record.validUpto)]] as [string, string][]) : []),
    ...(record.vehicle ? ([["Vehicle / vessel", record.vehicle]] as [string, string][]) : []),
    ...(record.weighbridge ? ([["Weighbridge", record.weighbridge]] as [string, string][]) : []),
    ["Status", `${record.status} (${record.ageDays} days in status)`],
    ["Review", record.reviewed ? `Reviewed by ${record.reviewed.by}, ${record.reviewed.designation} on ${formatDateTime(record.reviewed.at)}: ${record.reviewed.remark}` : "Not yet reviewed"],
  ];

  const sections: ReportSection[] = [
    { heading: "Record details", kind: "fields", rows: fields },
    {
      heading: "Reconciliation",
      kind: "table",
      columns: ["Source", "Quantity (MT)", "Difference vs first source"],
      numeric: [1, 2],
      rows: record.recon.sources.map((source, index) => [
        source.label,
        formatNumber(source.quantity),
        index === 0 ? "—" : formatNumber(Math.round((source.quantity - record.recon.sources[0]!.quantity) * 1000) / 1000),
      ]),
      note:
        record.recon.state === "provisional"
          ? `Provisional: awaiting ${record.recon.pendingSource}.`
          : `State: ${record.recon.state === "variance" ? `variance ${record.recon.variancePct}%` : "reconciled"}.`,
    },
    {
      heading: "Discrepancies",
      kind: "table",
      columns: ["Raised on", "Rule", "Severity", "Status", "Detail"],
      rows: record.discrepancies.map((item) => [formatDate(item.raisedOn), item.rule, item.severity.toUpperCase(), item.status, item.detail]),
    },
    ...(record.fees
      ? ([
          {
            heading: "Fee heads",
            kind: "table",
            columns: ["Head", "Amount (Rs.)"],
            numeric: [1],
            rows: record.fees.map((fee) => [fee.head, formatNumber(fee.amount)]),
          },
        ] as ReportSection[])
      : []),
    {
      heading: "Audit trail",
      kind: "table",
      columns: ["When", "By", "Action", "Remark", "Ack no."],
      rows: record.audit.map((entry) => [
        formatDateTime(entry.at),
        `${entry.by} (${entry.designation})`,
        entry.action,
        entry.remark ?? "",
        entry.ackNo ?? "",
      ]),
    },
  ];

  return { meta: metaFor(context, "RSH", `Record Sheet — ${record.refNo}`), sections };
}
