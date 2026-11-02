import type { RoleConfig } from "../../config/roleConfig";
import {
  formatCrore,
  formatMT,
  formatMillionMT,
  formatNumber,
  percentOf,
  sumBy,
} from "../../lib/format";
import type { DashboardData } from "../../hooks/useDashboardData";
import type { CountMetric, MaterialComposition, ScreeningOutput } from "../../types/dashboard";

/*
 * Every card in the grid is a DashboardItem: one normalised shape built from
 * the module data, so the grid, table, cross-filters and drawer navigation
 * work the same way across modules.
 */

export type ModuleKey = "stock" | "processing" | "dumps" | "payments" | "permits" | "operations" | "master";

export const MODULES: readonly { key: ModuleKey; label: string }[] = [
  { key: "stock", label: "Stock" },
  { key: "processing", label: "Processing" },
  { key: "dumps", label: "Dumps" },
  { key: "payments", label: "Payments" },
  { key: "permits", label: "Permits" },
  { key: "operations", label: "Operations" },
  { key: "master", label: "Master data" },
];

export const moduleLabel = (key: ModuleKey) => MODULES.find((module) => module.key === key)?.label ?? key;

export type StatusTone = "neutral" | "success" | "warning" | "critical" | "info" | "brand";

export interface DashboardItem {
  /** "<module>.<key>", also used in the URL (?panel=). */
  id: string;
  module: ModuleKey;
  title: string;
  /** Raw headline number, used for sorting. */
  value: number;
  /** Formatted headline. */
  display: string;
  /** One supporting fact, e.g. "Lumps 14,000 MT". */
  metric: string;
  /** Progress bar, 0–100. */
  progress?: { label: string; value: number };
  status: { tone: StatusTone; label: string };
  trend: number[];
  /** Cross-filter tags, e.g. "source:eauction". */
  tags: string[];
}

export const compositionTotal = ({ rom, lumps, fines }: MaterialComposition): number =>
  rom + lumps.total + fines.total;

export const screeningTotal = (output: ScreeningOutput): number =>
  compositionTotal(output) + (output.tailings ?? 0);

/** Highest-count breakdown entry, for "Top: …" summaries. */
const topDetail = (metric: CountMetric) =>
  metric.details.reduce((best, detail) => (detail.count > best.count ? detail : best), metric.details[0]!);

const OPERATION_TONE: Record<string, StatusTone> = {
  "active-permits": "info",
  "active-trips": "info",
  "awaiting-action": "warning",
  "completed-trips": "success",
  "expiring-permits": "warning",
  exceptions: "critical",
};

export function buildItems(data: DashboardData, roleConfig: RoleConfig): DashboardItem[] {
  const series = (id: string) => data.trends.itemSeries[id] ?? [];
  const items: DashboardItem[] = [];

  /* Stock */
  for (const source of data.stock) {
    const total = compositionTotal(source.views.total);
    const transported = compositionTotal(source.views.transported);
    items.push({
      id: `stock.${source.key}`,
      module: "stock",
      title: `${source.title} stock`,
      value: total,
      display: formatMT(total),
      metric: `Balance ${formatMT(compositionTotal(source.views.balance))}`,
      progress: { label: "Transported", value: percentOf(transported, total) },
      status: { tone: "neutral", label: "In stock" },
      trend: series(`stock.${source.key}`),
      tags: [`source:${source.key}`],
    });
  }

  /* Processing */
  for (const source of data.processing) {
    const total = compositionTotal(source);
    items.push({
      id: `processing.${source.key}`,
      module: "processing",
      title: source.flag ? `${source.title} · ${source.flag === "PRIMARY" ? "Primary" : "Non-primary"}` : source.title,
      value: total,
      display: formatMT(total),
      metric: `Lumps ${formatMT(source.lumps.total)}`,
      progress: { label: "Lumps + fines", value: percentOf(total - source.rom, total) },
      status: source.flag
        ? { tone: source.flag === "PRIMARY" ? "brand" : "neutral", label: source.flag === "PRIMARY" ? "Primary" : "Non-primary" }
        : { tone: "neutral", label: "Processed" },
      trend: series(`processing.${source.key}`),
      tags: [`source:${source.key.startsWith("royalty") ? "royalty" : source.key}`],
    });
  }

  /* Dumps */
  const { dumps } = data;
  const allocated = sumBy(dumps.allocation, (row) => row.allocated);
  const auctioned = sumBy(dumps.eauction, (row) => row.allocated);
  const extracted = sumBy(dumps.extraction, (row) => row.extracted);
  const transported = sumBy(dumps.extraction, (row) => row.transported);
  const wet = screeningTotal(dumps.screening.wet);
  const dry = screeningTotal(dumps.screening.dry);
  const waste = sumBy(dumps.waste, (row) => row.waste);

  items.push(
    {
      id: "dumps.annual",
      module: "dumps",
      title: "Annual total dump",
      value: allocated + auctioned,
      display: formatMillionMT(allocated + auctioned),
      metric: `eAuction ${formatMillionMT(auctioned)}`,
      progress: { label: "Allocation share", value: percentOf(allocated, allocated + auctioned) },
      status: { tone: "neutral", label: "Allotted" },
      trend: series("dumps.annual"),
      tags: [],
    },
    {
      id: "dumps.extracted",
      module: "dumps",
      title: "Extracted",
      value: extracted,
      display: formatMT(extracted),
      metric: `${dumps.extraction.length} ${dumps.extraction.length === 1 ? "party" : "parties"}`,
      progress: { label: "Transported", value: percentOf(transported, extracted) },
      status: { tone: "info", label: "Within geofence" },
      trend: series("dumps.extracted"),
      tags: [],
    },
    {
      id: "dumps.processed",
      module: "dumps",
      title: "Processed",
      value: wet + dry,
      display: formatMT(wet + dry),
      metric: `Wet ${formatMT(wet)} · Dry ${formatMT(dry)}`,
      progress: { label: "Wet screening", value: percentOf(wet, wet + dry) },
      status: { tone: "neutral", label: "Screened" },
      trend: series("dumps.processed"),
      tags: [],
    },
    {
      id: "dumps.waste",
      module: "dumps",
      title: "Waste",
      value: waste,
      display: formatMT(waste),
      metric: `${dumps.waste.length} ${dumps.waste.length === 1 ? "dump" : "dumps"}`,
      progress: { label: "Of extracted", value: percentOf(waste, extracted) },
      status: { tone: "warning", label: "Monitor" },
      trend: series("dumps.waste"),
      tags: [],
    }
  );

  /* Payments */
  const revenue = sumBy(data.payments, (head) => head.total);
  for (const head of data.payments) {
    items.push({
      id: `payments.${head.key}`,
      module: "payments",
      title: head.title,
      value: head.total,
      display: formatCrore(head.total),
      metric: head.description,
      progress: { label: "Of total collected", value: percentOf(head.total, revenue) },
      status: { tone: "success", label: `${head.rate} rate` },
      trend: series(`payments.${head.key}`),
      tags: [`payment:${head.key}`],
    });
  }

  /* Permits */
  const permitsToday = sumBy(data.permits, (permit) => permit.count);
  for (const permit of data.permits) {
    const top = permit.categories.reduce((best, item) => (item.count > best.count ? item : best));
    items.push({
      id: `permits.${permit.id}`,
      module: "permits",
      title: permit.title,
      value: permit.count,
      display: formatNumber(permit.count),
      metric: `Top: ${top.label}`,
      progress: { label: "Of today's permits", value: percentOf(permit.count, permitsToday) },
      status: { tone: "info", label: "Today" },
      trend: series(`permits.${permit.id}`),
      tags: [`permit:${permit.id}`],
    });
  }

  /* Operations */
  for (const metric of data.operations) {
    const top = topDetail(metric);
    items.push({
      id: `operations.${metric.id}`,
      module: "operations",
      title: metric.title,
      value: metric.count,
      display: formatNumber(metric.count),
      metric: `${top.label}: ${formatNumber(top.count)}`,
      progress: { label: top.label, value: percentOf(top.count, metric.count) },
      status: { tone: OPERATION_TONE[metric.id] ?? "neutral", label: metric.label },
      trend: series(`operations.${metric.id}`),
      tags: [],
    });
  }

  /* Master data */
  for (const entity of data.masterData.entities) {
    if (!roleConfig.masterData[entity.id]) continue;
    const healthy = entity.details[0]!;
    const share = percentOf(healthy.count, entity.count);
    items.push({
      id: `master.${entity.id}`,
      module: "master",
      title: entity.title,
      value: entity.count,
      display: formatNumber(entity.count),
      metric: `${healthy.label} ${formatNumber(healthy.count)}`,
      progress: { label: healthy.label, value: share },
      status: share >= 90 ? { tone: "success", label: "Healthy" } : { tone: "warning", label: "Needs attention" },
      trend: series(`master.${entity.id}`),
      tags: [],
    });
  }

  const { violations } = data.masterData;
  const topViolation = topDetail(violations);
  items.push({
    id: "master.violations",
    module: "master",
    title: "Violations",
    value: violations.count,
    display: formatNumber(violations.count),
    metric: `Top: ${topViolation.label}`,
    progress: { label: topViolation.label, value: percentOf(topViolation.count, violations.count) },
    status: { tone: "critical", label: "Open" },
    trend: series("master.violations"),
    tags: [],
  });

  return items;
}

/** Shared aggregates for the overview band (KPIs, flow strip, status bar). */
export function buildSummary(data: DashboardData) {
  const stockTotal = sumBy(data.stock, (source) => compositionTotal(source.views.total));
  const stockTransported = sumBy(data.stock, (source) => compositionTotal(source.views.transported));
  const metric = (id: string) => data.operations.find((item) => item.id === id);
  const weighbridges = data.masterData.entities.find((entity) => entity.id === "weighbridges");

  return {
    stockTotal,
    stockTransported,
    processedTotal: sumBy(data.processing, compositionTotal),
    permitsToday: sumBy(data.permits, (permit) => permit.count),
    activeTrips: metric("active-trips")?.count ?? 0,
    exceptions: metric("exceptions")?.count ?? 0,
    expiringPermits: metric("expiring-permits")?.count ?? 0,
    revenue: sumBy(data.payments, (head) => head.total),
    dumpAllotted: sumBy([...data.dumps.allocation, ...data.dumps.eauction], (row) => row.allocated),
    dumpExtracted: sumBy(data.dumps.extraction, (row) => row.extracted),
    dumpProcessed: screeningTotal(data.dumps.screening.wet) + screeningTotal(data.dumps.screening.dry),
    weighbridges: weighbridges
      ? { online: weighbridges.details[0]?.count ?? 0, total: weighbridges.count }
      : null,
  };
}

export type DashboardSummary = ReturnType<typeof buildSummary>;

