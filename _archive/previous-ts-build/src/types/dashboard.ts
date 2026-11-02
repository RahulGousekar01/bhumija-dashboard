/*
 * Domain types for the Bhumija dashboard.
 *
 * These describe the shape the backend API is expected to return.
 * Components only depend on these types, never on the mock data files.
 */

/* ---------- Roles & scope ---------- */

export type UserRole = "OFFICER" | "AUDITOR" | "PARTY";

export type FilterKey = "financialYear" | "district" | "taluka" | "organisation";

/** Reporting window, always ending on the as-of (T-1) date. */
export type Period = "T1" | "7D" | "30D" | "MTD" | "FY" | "RANGE";

/** What KPI and rollup changes are measured against. */
export type ComparePeriod = "D-1" | "W-1" | "M-1";

export interface DashboardFilters {
  financialYear: string;
  district: string;
  taluka: string;
  organisation: string;
  period: Period;
  /** Business date being viewed (YYYY-MM-DD); defaults to the latest T-1. */
  asOfDate: string;
  compare: ComparePeriod;
  /** Custom range, used when period is RANGE. */
  rangeFrom: string;
  rangeTo: string;
}

/** Everything a data request needs to know to scope its results. */
export interface DashboardScope extends DashboardFilters {
  role: UserRole;
}

/* ---------- Shared building blocks ---------- */

export interface GradeBand {
  /** Fe-content range, e.g. "41–45%". */
  range: string;
  quantity: number;
}

export interface GradedMaterial {
  total: number;
  grades: GradeBand[];
}

/** ROM has no grade; lumps and fines are split into grade bands. */
export interface MaterialComposition {
  rom: number;
  lumps: GradedMaterial;
  fines: GradedMaterial;
}

export interface CountBreakdown {
  label: string;
  count: number;
}

/** A headline count with its breakdown (permits, operations, master data). */
export interface CountMetric {
  id: string;
  title: string;
  count: number;
  label: string;
  details: CountBreakdown[];
}

/* ---------- Stock ---------- */

export type StockView = "total" | "transported" | "balance";

export interface StockSource {
  key: string;
  title: string;
  views: Record<StockView, MaterialComposition>;
}

/* ---------- Ore processing ---------- */

export type RoyaltyFlag = "PRIMARY" | "NON PRIMARY";

export interface ProcessingSource extends MaterialComposition {
  key: string;
  title: string;
  flag?: RoyaltyFlag;
}

/* ---------- Dumps ---------- */

export interface DumpAllocationRow {
  party: string;
  allocated: number;
}

export interface DumpExtractionRow {
  party: string;
  extracted: number;
  transported: number;
}

export type ScreeningMethod = "wet" | "dry";

export interface ScreeningOutput extends MaterialComposition {
  /** Wet screening only. */
  tailings?: number;
}

export interface DumpWasteRow {
  party: string;
  dump: string;
  allocated: number;
  waste: number;
}

export interface DumpsSummaryData {
  allocation: DumpAllocationRow[];
  eauction: DumpAllocationRow[];
  extraction: DumpExtractionRow[];
  screening: Record<ScreeningMethod, ScreeningOutput>;
  waste: DumpWasteRow[];
}

/* ---------- Payments ---------- */

export interface MaterialPayment {
  stock: number;
  amount: number;
}

export type MaterialPayments = Record<"rom" | "lumps" | "fines", MaterialPayment>;

export interface RegionPayment {
  key: string;
  name: string;
  total: number;
  materials: MaterialPayments;
}

interface PaymentHeadBase {
  key: string;
  title: string;
  rate: string;
  description: string;
  total: number;
}

export type PaymentHead =
  | (PaymentHeadBase & { type: "material"; materials: MaterialPayments })
  | (PaymentHeadBase & { type: "regional"; regions: RegionPayment[] });

/* ---------- Permits ---------- */

export interface PermitType {
  id: string;
  title: string;
  count: number;
  categories: CountBreakdown[];
  purposes: CountBreakdown[];
}

/* ---------- Master data ---------- */

export type MasterDataKey =
  | "parties"
  | "trucks"
  | "barges"
  | "locations"
  | "weighbridges"
  | "yards"
  | "processingUnits"
  | "routes";

export interface MasterDataMetric extends CountMetric {
  id: MasterDataKey;
}

export interface MasterDataSummary {
  entities: MasterDataMetric[];
  violations: CountMetric;
}

/* ---------- Alerts & activity ---------- */

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  time: string;
}

export type ActivityType = "permit" | "trip" | "weighbridge" | "processing" | "payment";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
}

export interface AlertActivityData {
  alerts: AlertItem[];
  activities: ActivityItem[];
}

/* ---------- Trends ---------- */

export interface TrendPoint {
  /** Bucket label: an hour, a day or a month depending on the period. */
  label: string;
  permits: number;
  trips: number;
  /** Tonnage dispatched in the bucket. */
  dispatch: number;
  /** Payments collected in the bucket (₹). */
  revenue: number;
}

export type KpiKey = "stock" | "processed" | "permits" | "trips" | "revenue" | "alerts";

export interface OverviewTrends {
  period: Period;
  points: TrendPoint[];
  /** Change vs the previous period, in percent. */
  deltas: Record<KpiKey, number>;
  /** Short series for KPI sparklines. */
  sparklines: Record<KpiKey, number[]>;
  /** Per-item sparkline series for the grid, keyed by item id. */
  itemSeries: Record<string, number[]>;
}
