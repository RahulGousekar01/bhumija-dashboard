import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL, COMPARE_OPTIONS, CURRENT_PARTY, PERIODS, initialFilters } from "../config/filterOptions";
import { roleConfig, type RoleConfig } from "../config/roleConfig";
import { DEFAULT_STATUS_COLORS, type StatusColors } from "../config/statusPalette";
import { latestT1 } from "../lib/dates";
import { readUrlParams, writeUrlParams } from "../lib/urlState";
import { mockDashboardApi, type DashboardApi } from "../services/dashboardApi";
import type { DashboardFilters, DashboardScope, UserRole } from "../types/dashboard";
import type { Officer } from "../types/governance";

/** A selection made by clicking a chart; narrows the module summaries grid. */
export interface CrossFilter {
  /** Matches an item tag, e.g. "source:eauction" or "payment:dmf". */
  tag: string;
  label: string;
}

interface DashboardContextValue {
  api: DashboardApi;
  role: UserRole;
  setRole: (role: UserRole) => void;
  /** True when the role comes from the session and must not be switched. */
  roleLocked: boolean;
  roleConfig: RoleConfig;
  isParty: boolean;
  /** The signed-in officer, stamped on reviews, sign-offs and reports. */
  officer: Officer;
  /** Workflow status colours (from the portal's bhumijaColorView when embedded). */
  statusColors: StatusColors;

  filters: DashboardFilters;
  /** Role + effective filters; this is what data requests are keyed on. */
  scope: DashboardScope;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;

  crossFilter: CrossFilter | null;
  toggleCrossFilter: (filter: CrossFilter) => void;
  clearCrossFilter: () => void;

  /** Bumped by refresh(); data requests re-run when it changes. */
  refreshKey: number;
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/* ---------- URL <-> filters ---------- */

const URL_KEYS: Record<keyof DashboardFilters, string> = {
  financialYear: "fy",
  district: "district",
  taluka: "taluka",
  organisation: "org",
  period: "period",
  asOfDate: "asof",
  compare: "compare",
  rangeFrom: "from",
  rangeTo: "to",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersFromUrl = (defaults: DashboardFilters): DashboardFilters => {
  const params = readUrlParams();
  const get = (key: keyof DashboardFilters) => params.get(URL_KEYS[key]);
  const date = (key: "asOfDate" | "rangeFrom" | "rangeTo") => {
    const value = get(key);
    // Never later than the latest T-1 day.
    return value && ISO_DATE.test(value) && value <= defaults.asOfDate ? value : defaults[key];
  };
  const period = get("period");
  const compare = get("compare");

  return {
    financialYear: get("financialYear") ?? defaults.financialYear,
    district: get("district") ?? defaults.district,
    taluka: get("taluka") ?? defaults.taluka,
    organisation: get("organisation") ?? defaults.organisation,
    period: PERIODS.some((option) => option.value === period) ? (period as DashboardFilters["period"]) : defaults.period,
    compare: COMPARE_OPTIONS.some((option) => option.value === compare)
      ? (compare as DashboardFilters["compare"])
      : defaults.compare,
    asOfDate: date("asOfDate"),
    rangeFrom: date("rangeFrom"),
    rangeTo: date("rangeTo"),
  };
};

/** Only non-default values are written, so a default view has a clean URL. */
const filtersToUrl = (filters: DashboardFilters, defaults: DashboardFilters) =>
  Object.fromEntries(
    (Object.keys(URL_KEYS) as (keyof DashboardFilters)[]).map((key) => [
      URL_KEYS[key],
      filters[key] === defaults[key] ? undefined : filters[key],
    ])
  );

/* ---------- Provider ---------- */

interface DashboardProviderProps {
  children: ReactNode;
  /** Data source. Defaults to the sample-data implementation. */
  api?: DashboardApi;
  /** Should come from the authenticated session in the main application. */
  initialRole?: UserRole;
  /** Signed-in user; defaults to the role's prototype identity. */
  officer?: Officer;
  /** Status colours from the portal (bhumijaColorView); defaults to the portal's standard palette. */
  statusColors?: Partial<StatusColors>;
  /** Mirror filters in the URL query string. */
  syncUrl?: boolean;
  /** Hide the prototype role switcher when the role comes from the session. */
  lockRole?: boolean;
}

export function DashboardProvider({
  children,
  api = mockDashboardApi,
  initialRole = "OFFICER",
  officer,
  statusColors,
  syncUrl = true,
  lockRole = false,
}: DashboardProviderProps) {
  const defaults = useMemo(() => initialFilters(), []);
  const [role, setRoleState] = useState<UserRole>(initialRole);
  const [filters, setFilters] = useState<DashboardFilters>(() => (syncUrl ? filtersFromUrl(defaults) : defaults));
  const [crossFilter, setCrossFilter] = useState<CrossFilter | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (syncUrl) writeUrlParams(filtersToUrl(filters, defaults));
  }, [filters, syncUrl, defaults]);

  const setRole = useCallback((nextRole: UserRole) => {
    setRoleState(nextRole);
    setCrossFilter(null);
    setFilters((current) => ({ ...current, organisation: ALL }));
  }, []);

  const setFilter = useCallback(<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      // The taluka list depends on the district, so a new district resets it.
      ...(key === "district" ? { taluka: ALL } : null),
    }));
  }, []);

  const resetFilters = useCallback(() => {
    // Recompute: the latest T-1 day may have moved on since the page loaded.
    setFilters(initialFilters());
    setCrossFilter(null);
  }, []);

  const toggleCrossFilter = useCallback((next: CrossFilter) => {
    setCrossFilter((current) => (current?.tag === next.tag ? null : next));
  }, []);

  const clearCrossFilter = useCallback(() => setCrossFilter(null), []);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const value = useMemo<DashboardContextValue>(() => {
    const isParty = role === "PARTY";
    const config = roleConfig[role];

    // A party is always scoped to its own organisation.
    const effectiveFilters = isParty ? { ...filters, organisation: CURRENT_PARTY } : filters;
    const asOfDate = effectiveFilters.asOfDate > latestT1() ? latestT1() : effectiveFilters.asOfDate;

    return {
      api,
      role,
      setRole,
      roleLocked: lockRole,
      roleConfig: config,
      isParty,
      officer: officer ?? config.user,
      statusColors: { ...DEFAULT_STATUS_COLORS, ...statusColors },
      filters: { ...effectiveFilters, asOfDate },
      scope: { ...effectiveFilters, asOfDate, role },
      setFilter,
      resetFilters,
      crossFilter,
      toggleCrossFilter,
      clearCrossFilter,
      refreshKey,
      refresh,
    };
  }, [
    api,
    role,
    lockRole,
    officer,
    statusColors,
    filters,
    crossFilter,
    refreshKey,
    setRole,
    setFilter,
    resetFilters,
    toggleCrossFilter,
    clearCrossFilter,
    refresh,
  ]);

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside <DashboardProvider>");
  }

  return context;
}
