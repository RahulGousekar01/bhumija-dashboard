import type { DashboardScope, KpiKey, OverviewTrends, Period, TrendPoint } from "../../types/dashboard";
import { addDays, financialYearStart, formatDayMonth, monthStart } from "../../lib/dates";
import { hashString, seededRandom } from "../../lib/random";
import { masterDataEntities } from "./masterData";
import { operationMetrics, permitTypes } from "./operations";
import { paymentHeads } from "./payments";
import { processingSources } from "./processing";
import { stockSources } from "./stock";

/*
 * Prototype trend data for the module summaries. Values come from a seeded
 * random walk so they are stable between renders but differ by period and
 * scope. Every window ends on the as-of (T-1) date.
 */

const randomWalk = (random: () => number, length: number, base: number, spread = 0.18) => {
  let value = base;
  return Array.from({ length }, () => {
    value = Math.max(base * 0.4, value * (1 + (random() - 0.48) * spread));
    return Math.round(value);
  });
};

const dayLabels = (from: string, to: string) => {
  const labels: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) labels.push(formatDayMonth(day));
  return labels;
};

const bucketLabels = (scope: DashboardScope): { labels: string[]; scale: number } => {
  const asOf = scope.asOfDate;
  switch (scope.period as Period) {
    case "T1":
    case "7D":
      return { labels: dayLabels(addDays(asOf, -6), asOf), scale: 1 };
    case "30D":
      return { labels: dayLabels(addDays(asOf, -29), asOf), scale: 1 };
    case "MTD":
      return { labels: dayLabels(monthStart(asOf), asOf), scale: 1 };
    case "RANGE":
      return { labels: dayLabels(scope.rangeFrom, scope.rangeTo > asOf ? asOf : scope.rangeTo), scale: 1 };
    case "FY": {
      const labels: string[] = [];
      for (let month = financialYearStart(asOf); month <= asOf; month = monthStart(addDays(month, 32))) {
        labels.push(new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(`${month}T00:00:00Z`)));
      }
      return { labels, scale: 30 };
    }
  }
};

const ITEM_IDS = [
  ...stockSources.map((source) => `stock.${source.key}`),
  ...processingSources.map((source) => `processing.${source.key}`),
  "dumps.annual",
  "dumps.extracted",
  "dumps.processed",
  "dumps.waste",
  ...paymentHeads.map((head) => `payments.${head.key}`),
  ...permitTypes.map((permit) => `permits.${permit.id}`),
  ...operationMetrics.map((metric) => `operations.${metric.id}`),
  ...masterDataEntities.map((entity) => `master.${entity.id}`),
  "master.violations",
];

const KPI_KEYS: KpiKey[] = ["stock", "processed", "permits", "trips", "revenue", "alerts"];

export function buildTrends(scope: DashboardScope): OverviewTrends {
  const { period } = scope;
  const random = seededRandom(hashString(JSON.stringify(scope)));
  const { labels, scale } = bucketLabels(scope);

  const permits = randomWalk(random, labels.length, 86 * scale);
  const trips = randomWalk(random, labels.length, 170 * scale);
  const dispatch = randomWalk(random, labels.length, 720 * scale);
  const revenue = randomWalk(random, labels.length, 1_000_000 * scale, 0.25);

  const points: TrendPoint[] = labels.map((label, index) => ({
    label,
    permits: permits[index] ?? 0,
    trips: trips[index] ?? 0,
    dispatch: dispatch[index] ?? 0,
    revenue: revenue[index] ?? 0,
  }));

  const delta = () => Math.round((random() * 30 - 12) * 10) / 10;

  return {
    period,
    points,
    deltas: Object.fromEntries(KPI_KEYS.map((key) => [key, delta()])) as Record<KpiKey, number>,
    sparklines: Object.fromEntries(
      KPI_KEYS.map((key) => [key, randomWalk(random, 12, 100)])
    ) as Record<KpiKey, number[]>,
    itemSeries: Object.fromEntries(ITEM_IDS.map((id) => [id, randomWalk(random, 12, 100)])),
  };
}
