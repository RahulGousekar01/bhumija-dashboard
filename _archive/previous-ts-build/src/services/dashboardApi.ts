import type {
  AlertActivityData,
  CountMetric,
  DashboardScope,
  DumpsSummaryData,
  MasterDataSummary,
  OverviewTrends,
  PaymentHead,
  PermitType,
  ProcessingSource,
  StockSource,
} from "../types/dashboard";
import type { ActionResult, GovernanceSnapshot, Officer, Severity } from "../types/governance";
import { buildSnapshot, governanceActions } from "./mock/governance";
import { stockSources } from "./mock/stock";
import { processingSources } from "./mock/processing";
import { dumpsSummary } from "./mock/dumps";
import { paymentHeads } from "./mock/payments";
import { operationMetrics, permitTypes } from "./mock/operations";
import { alertActivity, masterDataEntities, violations } from "./mock/masterData";
import { buildTrends } from "./mock/trends";

/**
 * Data contract between the dashboard and the backend.
 *
 * Every method receives the current scope (role + filters) and is expected to
 * return data already scoped to it. Pass a real implementation to
 * `<DashboardProvider api={...}>` when integrating with the main application.
 */
export interface DashboardApi {
  getStockSummary(scope: DashboardScope, signal?: AbortSignal): Promise<StockSource[]>;
  getOreProcessing(scope: DashboardScope, signal?: AbortSignal): Promise<ProcessingSource[]>;
  getDumpsSummary(scope: DashboardScope, signal?: AbortSignal): Promise<DumpsSummaryData>;
  getPaymentSummary(scope: DashboardScope, signal?: AbortSignal): Promise<PaymentHead[]>;
  getPermitOverview(scope: DashboardScope, signal?: AbortSignal): Promise<PermitType[]>;
  getOperationsOverview(scope: DashboardScope, signal?: AbortSignal): Promise<CountMetric[]>;
  getMasterData(scope: DashboardScope, signal?: AbortSignal): Promise<MasterDataSummary>;
  getAlertActivity(scope: DashboardScope, signal?: AbortSignal): Promise<AlertActivityData>;
  getTrends(scope: DashboardScope, signal?: AbortSignal): Promise<OverviewTrends>;
  /** Optional: when omitted, the Acknowledge action is hidden. */
  acknowledgeAlert?(alertId: string): Promise<void>;

  /** T-1 governance view: as-of metadata, KPIs, trends, register, sign-off. */
  getGovernanceSnapshot(scope: DashboardScope, signal?: AbortSignal): Promise<GovernanceSnapshot>;

  /*
   * Officer actions. Each returns the acknowledgement number the portal
   * issues on saves. Omit an action to hide its controls.
   */
  markReviewed?(recordId: string, remark: string, officer: Officer): Promise<ActionResult>;
  flagDiscrepancy?(
    recordId: string,
    input: { rule: string; severity: Severity; remark: string },
    officer: Officer
  ): Promise<ActionResult>;
  updateDiscrepancy?(
    recordId: string,
    discrepancyId: string,
    status: "Under review" | "Resolved" | "Justified",
    remark: string,
    officer: Officer
  ): Promise<ActionResult>;
  signOff?(jurisdictionKey: string, remark: string, officer: Officer): Promise<ActionResult>;
  logExport?(report: string, format: "PDF" | "Excel", officer: Officer, recordId?: string): Promise<ActionResult>;
}

const MOCK_LATENCY_MS = 250;

const resolveAfterDelay = <T,>(value: T, signal?: AbortSignal): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(value), MOCK_LATENCY_MS);
    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

/*
 * Prototype implementation backed by sample data. The governance snapshot
 * applies role, jurisdiction, organisation, period and as-of filters; the
 * module summaries simulate role scoping only.
 */
export const mockDashboardApi: DashboardApi = {
  getStockSummary: (_scope, signal) => resolveAfterDelay(stockSources, signal),

  getOreProcessing: (_scope, signal) => resolveAfterDelay(processingSources, signal),

  getDumpsSummary: (scope, signal) => {
    const isOwn = scope.role === "PARTY";
    return resolveAfterDelay(
      {
        ...dumpsSummary,
        extraction: isOwn ? dumpsSummary.extraction.slice(0, 1) : dumpsSummary.extraction,
        waste: isOwn ? dumpsSummary.waste.slice(0, 1) : dumpsSummary.waste,
      },
      signal
    );
  },

  getPaymentSummary: (_scope, signal) => resolveAfterDelay(paymentHeads, signal),

  getPermitOverview: (_scope, signal) => resolveAfterDelay(permitTypes, signal),

  getOperationsOverview: (_scope, signal) => resolveAfterDelay(operationMetrics, signal),

  getMasterData: (scope, signal) =>
    resolveAfterDelay(
      {
        entities: masterDataEntities,
        violations: scope.role === "PARTY" ? violations.own : violations.all,
      },
      signal
    ),

  getAlertActivity: (_scope, signal) => resolveAfterDelay(alertActivity, signal),

  getTrends: (scope, signal) => resolveAfterDelay(buildTrends(scope), signal),

  acknowledgeAlert: () => resolveAfterDelay(undefined),

  getGovernanceSnapshot: (scope, signal) => resolveAfterDelay(buildSnapshot(scope), signal),

  markReviewed: async (...args) => resolveAfterDelay(governanceActions.markReviewed(...args)),
  flagDiscrepancy: async (...args) => resolveAfterDelay(governanceActions.flagDiscrepancy(...args)),
  updateDiscrepancy: async (...args) => resolveAfterDelay(governanceActions.updateDiscrepancy(...args)),
  signOff: async (...args) => resolveAfterDelay(governanceActions.signOff(...args)),
  logExport: async (...args) => resolveAfterDelay(governanceActions.logExport(...args)),
};
