import { addDays, financialYearLabel, latestT1 } from "../lib/dates";
import type { ComparePeriod, DashboardFilters, Period } from "../types/dashboard";

export const ALL = "ALL";

/** Organisation value used when a party is scoped to itself. */
export const CURRENT_PARTY = "CURRENT_PARTY";

export const PERIODS: readonly { value: Period; label: string; long: string }[] = [
  { value: "T1", label: "T-1", long: "the as-of day" },
  { value: "7D", label: "7D", long: "the 7 days to the as-of date" },
  { value: "30D", label: "30D", long: "the 30 days to the as-of date" },
  { value: "MTD", label: "MTD", long: "month to date" },
  { value: "FY", label: "FY", long: "financial year to date" },
  { value: "RANGE", label: "Range", long: "the selected range" },
];

export const COMPARE_OPTIONS: readonly { value: ComparePeriod; label: string }[] = [
  { value: "D-1", label: "Previous day" },
  { value: "W-1", label: "Same day last week" },
  { value: "M-1", label: "Same day last month" },
];

export const FINANCIAL_YEARS = ["2026-27", "2025-26", "2024-25"];

/** Mining talukas by district. Talukas follow the district choice. */
export const TALUKAS_BY_DISTRICT: Record<string, string[]> = {
  "North Goa": ["Bicholim", "Sattari"],
  "South Goa": ["Sanguem", "Dharbandora", "Quepem"],
};

export const DISTRICTS = Object.keys(TALUKAS_BY_DISTRICT);

export const ORGANISATIONS = [
  "ABC Mining Pvt Ltd",
  "XYZ Minerals",
  "Goa Ore Industries",
  "Konkan Minerals",
  "Mandovi Ore Traders",
  "Zuari Mineral Logistics",
];

export const talukasFor = (district: string): string[] =>
  district === ALL ? Object.values(TALUKAS_BY_DISTRICT).flat() : TALUKAS_BY_DISTRICT[district] ?? [];

export const districtOf = (taluka: string): string =>
  Object.entries(TALUKAS_BY_DISTRICT).find(([, talukas]) => talukas.includes(taluka))?.[0] ?? "";

export function initialFilters(now = new Date()): DashboardFilters {
  const asOf = latestT1(now);
  return {
    financialYear: financialYearLabel(asOf),
    district: ALL,
    taluka: ALL,
    organisation: ALL,
    period: "30D",
    asOfDate: asOf,
    compare: "D-1",
    rangeFrom: addDays(asOf, -13),
    rangeTo: asOf,
  };
}

/** Kept for code that needs a static default (tests, docs). */
export const INITIAL_FILTERS: DashboardFilters = initialFilters();
